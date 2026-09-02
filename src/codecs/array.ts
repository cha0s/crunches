import {
  CrunchesType,
  CrunchesNumeric,
  type Target,
  type TypedArrayConstructor,
} from '#types'

import { boolean, type CrunchesBoolean } from './boolean'
import { CrunchesUint8, uint8 } from './uint8'
import { reiterable } from '../reiterable.ts'

type TypedArrayFor<E extends CrunchesNumeric<number | bigint>> =
  InstanceType<E['typedArray']>

type ArrayElementMaybeUndefined<T, IsSparse> = IsSparse extends true
  ? T | undefined
  : T

// input type: any iterable of the element's input type
export type CrunchesArrayInput<
  E extends CrunchesType<unknown, unknown>,
  IsSparse
> =
  Iterable<
    ArrayElementMaybeUndefined<E extends CrunchesNumeric<infer N> ? N : E['_input'], IsSparse>
  >

// output type: TypedArray for numeric elements, regular array otherwise
export type CrunchesArrayOutput<
  E extends CrunchesType<unknown, unknown>,
  IsSparse
> =
  E extends CrunchesNumeric<number | bigint>
    ? TypedArrayFor<E>
    : Array<ArrayElementMaybeUndefined<E['_output'], IsSparse>>

/**
 * Array codec.
 */
export class CrunchesArray<
  E extends CrunchesType<any>,
  IsSparse extends boolean = false
>
  extends CrunchesType<CrunchesArrayOutput<E, IsSparse>, CrunchesArrayInput<E, IsSparse>>
{

  $$elementCodec: CrunchesType<unknown>
  $$isDenseCodec: CrunchesBoolean
  $$isPossiblySparse: boolean
  length: number
  $$presenceCodec: IsSparse extends true ? CrunchesArray<CrunchesUint8> : undefined
  $$typedArray: TypedArrayConstructor | undefined

  constructor({ element, length = 0, sparse = false as IsSparse }: { element: E; length?: number; sparse?: IsSparse }) {
    super()
    this.$$elementCodec = element
    this.$$isDenseCodec = boolean()
    this.$$isPossiblySparse = sparse
    this.length = length
    this.$$presenceCodec = (sparse ? array({ element: uint8() }) : undefined) as any
    this.$$typedArray = element instanceof CrunchesNumeric ? element.typedArray : undefined
  }

  private canUseTypedArray(): boolean {
    return !!this.$$typedArray
      && false !== this.$$elementCodec.isLittleEndian
      && (!this.$$isPossiblySparse || ((BigInt64Array !== this.$$typedArray) && (BigUint64Array !== this.$$typedArray)))
  }

  private absoluteByteOffset(view: DataView, byteOffset: number) {
    return view.byteOffset + byteOffset
  }

  private typedArrayOffset(view: DataView, byteOffset: number) {
    return this.absoluteByteOffset(view, byteOffset) % this.$$typedArray!.BYTES_PER_ELEMENT
  }

  bigEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.bigEndian()
    }
    this.$$isDenseCodec.bigEndian()
    this.$$presenceCodec?.bigEndian()
    return super.bigEndian()
  }

  canBeEncodedAsTypedArray(value: any) {
    return this.canUseTypedArray()
      && (Array.isArray(value) || ArrayBuffer.isView(value))
  }

  decodeFrom(view: DataView, target: Target) {
    let length: number
    if (0 === this.length) {
      length = view.getUint32(target.byteOffset, this.isLittleEndian ?? true)
      target.byteOffset += 4
    }
    else {
      length = this.length
    }
    const isDense = this.$$isPossiblySparse ? this.$$isDenseCodec.decodeFrom(view, target) : true
    // sparse
    if (!isDense) {
      const presence = this.$$presenceCodec!.decodeFrom(view, target)
      const value: Array<E['_output']> = Array(length)
      for (let i = 0; i < length; ++i) {
        if (presence[i >> 3] & (1 << (i & 7))) {
          value[i] = this.$$elementCodec.decodeFrom(view, target)
        }
      }
      return value as CrunchesArrayOutput<E, IsSparse>
    }
    if (this.$$typedArray) {
      const offset = target.byteOffset + this.$$elementCodec.padding(target.byteOffset)
      target.byteOffset = offset
      if (
        false !== this.$$elementCodec.isLittleEndian
        && (!this.$$isPossiblySparse || ((BigInt64Array !== this.$$typedArray) && (BigUint64Array !== this.$$typedArray)))
        && 0 === this.typedArrayOffset(view, offset)
      ) {
        const value = new this.$$typedArray(view.buffer as ArrayBuffer, this.absoluteByteOffset(view, offset), length)
        target.byteOffset += this.$$typedArray.BYTES_PER_ELEMENT * length
        return value as CrunchesArrayOutput<E, IsSparse>
      }
    }
    // dynamic shape
    {
      const value: Array<E['_output']> = Array(length)
      for (let i = 0; i < length; ++i) {
        value[i] = this.$$elementCodec.decodeFrom(view, target)
      }
      return value as CrunchesArrayOutput<E, IsSparse>
    }
  }

  encodeInto(value: CrunchesArrayInput<E, IsSparse>, view: DataView, byteOffset: number) {
    value = reiterable(value)
    let written = 0
    let isDense = true
    if (this.$$isPossiblySparse) {
      if (this.canBeEncodedAsTypedArray(value)) {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; ++i) {
            if (undefined === value[i] && i in value) {
              isDense = false
              break
            }
          }
        }
      }
      else {
        for (const element of value) {
          if (undefined === element) {
            isDense = false
            break
          }
        }
      }
    }
    if (0 === this.length) {
      let length = 0
      written += 4 // prefix
      if (this.$$isPossiblySparse) {
        written += this.$$isDenseCodec.encodeInto(isDense, view, byteOffset + written)
      }
      // sparse
      if (!isDense) {
        const presence: number[] = []
        for (const element of value) {
          if (undefined !== element) {
            presence[length >> 3] |= 1 << (length & 7)
          }
          length += 1
        }
        written += this.$$presenceCodec!.encodeInto(presence, view, byteOffset + written)
        for (const element of value) {
          if (undefined !== element) {
            written += this.$$elementCodec.encodeInto(element, view, byteOffset + written)
          }
        }
      }
      else {
        if (this.$$typedArray) {
          written += this.$$elementCodec.padding(byteOffset + written)
        }
        // TypedArray
        if (this.canBeEncodedAsTypedArray(value) && 0 === this.typedArrayOffset(view, byteOffset + written)) {
          length = (value as E['_input']).length
          new this.$$typedArray!(
            view.buffer as ArrayBuffer,
            this.absoluteByteOffset(view, byteOffset + written),
            length,
          ).set(Array.isArray(value) ? new this.$$typedArray!(value) : value as any)
          written += this.$$typedArray!.BYTES_PER_ELEMENT * length
        }
        // dynamic shape, big endian, iterator
        else {
          for (const element of value) {
            length += 1
            written += this.$$elementCodec.encodeInto(element, view, byteOffset + written)
          }
        }
      }
      view.setUint32(byteOffset, length, this.isLittleEndian ?? true)
    }
    else {
      if (this.$$isPossiblySparse) {
        written += this.$$isDenseCodec.encodeInto(isDense, view, byteOffset + written)
      }
      // sparse
      if (!isDense) {
        let protocol = value[Symbol.iterator]()
        let result = protocol.next()
        const presence: number[] = []
        const values = []
        for (let i = 0; i < this.length; ++i) {
          if (undefined !== result.value) {
            presence[i >> 3] |= 1 << (i & 7)
            values.push(result.value)
          }
          result = protocol.next()
        }
        written += this.$$presenceCodec!.encodeInto(presence, view, byteOffset + written)
        for (const value of values) {
          written += this.$$elementCodec.encodeInto(value, view, byteOffset + written)
        }
      }
      else {
        if (this.$$typedArray) {
          written += this.$$elementCodec.padding(byteOffset + written)
        }
        // TypedArray
        if (this.canBeEncodedAsTypedArray(value) && 0 === this.typedArrayOffset(view, byteOffset + written)) {
          if ((value as E['_input']).length < this.length) {
            throw new RangeError(`Array length (${(value as E['_input']).length}) is shorter than fixed array length (${this.length})`)
          }
          new this.$$typedArray!(
            view.buffer as ArrayBuffer,
            this.absoluteByteOffset(view, byteOffset + written),
            this.length,
          ).set(Array.isArray(value) ? new this.$$typedArray!(value) : value as any)
          written += this.$$typedArray!.BYTES_PER_ELEMENT * this.length
        }
        // dynamic shape, big endian, iterator
        else {
          let protocol = value[Symbol.iterator]()
          let result = protocol.next()
          for (let i = 0; i < this.length; ++i) {
            if (result.done) {
              throw new RangeError(`Array length (${i}) is shorter than fixed array length (${this.length})`)
            }
            written += this.$$elementCodec.encodeInto(result.value, view, byteOffset + written)
            result = protocol.next()
          }
        }
      }
    }
    return written
  }

  littleEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.littleEndian()
    }
    this.$$isDenseCodec.littleEndian()
    this.$$presenceCodec?.littleEndian()
    return super.littleEndian()
  }

  sizeOf(value: CrunchesArrayInput<E, IsSparse>, byteOffset: number) {
    value = reiterable(value)
    let isDense = true
    let size = 0
    if (this.$$isPossiblySparse) {
      if (this.canBeEncodedAsTypedArray(value)) {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; ++i) {
            if (undefined === value[i] && i in value) {
              isDense = false
              break
            }
          }
        }
      }
      else {
        for (const element of value) {
          if (undefined === element) {
            isDense = false
            break
          }
        }
      }
    }
    // varlen
    if (0 === this.length) {
      size += 4 // length
      if (this.$$isPossiblySparse) {
        size += 1 // isDense
      }
      // sparse
      if (!isDense) {
        let i = 0
        const values = []
        for (const element of value) {
          values.push(element)
          i += 1
        }
        size += 4 + Math.ceil(i / 8)
        for (const element of values) {
          if (undefined !== element) {
            size += this.$$elementCodec.sizeOf(element, size + byteOffset)
          }
        }
      }
      else {
        if (this.$$typedArray) {
          size += this.$$elementCodec.padding(byteOffset + size)
        }
        // TypedArray
        if (this.canBeEncodedAsTypedArray(value)) {
          return size + (value as E['_input']).length * this.$$typedArray!.BYTES_PER_ELEMENT
        }
        else {
          for (const element of value) {
            size += this.$$elementCodec.sizeOf(element, size + byteOffset)
          }
        }
      }
      return size
    }
    // fixed
    else {
      if (this.$$isPossiblySparse) {
        size += 1 // isDense
      }
      // sparse
      if (!isDense) {
        let protocol = value[Symbol.iterator]()
        let result = protocol.next()
        size += 4 + Math.ceil(this.length / 8)
        for (let i = 0; i < this.length; ++i) {
          if (undefined !== result.value) {
            size += this.$$elementCodec.sizeOf(result.value, size + byteOffset)
          }
          result = protocol.next()
        }
      }
      else {
        if (this.$$typedArray) {
          size += this.$$elementCodec.padding(byteOffset + size)
        }
        // TypedArray
        if (this.canBeEncodedAsTypedArray(value)) {
          if ((value as E['_input']).length < this.length) {
            throw new RangeError(`Array length (${(value as E['_input']).length}) is shorter than fixed array length (${this.length})`)
          }
          size += this.length * this.$$typedArray!.BYTES_PER_ELEMENT
        }
        // iterable
        else {
          let protocol = value[Symbol.iterator]()
          let result = protocol.next()
          for (let i = 0; i < this.length; ++i) {
            if (result.done) {
              throw new RangeError(`Array length (${i}) is shorter than fixed array length (${this.length})`)
            }
            size += this.$$elementCodec.sizeOf(result.value, size + byteOffset)
            result = protocol.next()
          }
        }
      }
    }
    return size
  }

}

/**
 * Create array codec.
 * @param options Array options.
 * @param options.element The element type.
 * @param options.length Optional length of the (fixed-size) array.
 * @param options.sparse Whether the codec accepts sparse arrays (carries a performance penalty).
 */
export function array<
  E extends CrunchesType<any>,
  IsSparse extends boolean = false
>(
  options: { element: E; length?: number, sparse?: IsSparse }
) {
  return new CrunchesArray(options)
}
