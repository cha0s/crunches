import {
  CrunchesType,
  CrunchesNumeric,
  type Target,
  type TypedArrayConstructor,
} from '#types'

import { boolean, type CrunchesBoolean } from './boolean'
import { CrunchesUint8, uint8 } from './uint8'

type TypedArrayFor<E extends CrunchesNumeric<number | bigint>> =
  InstanceType<E['elementClass']>

type MaybeUndefined<T, IsSparse> = IsSparse extends true
  ? T | undefined
  : T

// input type: any iterable of the element's input type
export type CrunchesArrayInput<
  E extends CrunchesType<unknown, unknown>,
  IsSparse
> =
  Iterable<
    MaybeUndefined<E extends CrunchesNumeric<infer N> ? N : E['_input'], IsSparse>
  >

// output type: TypedArray for numeric elements, regular array otherwise
export type CrunchesArrayOutput<
  E extends CrunchesType<unknown, unknown>,
  IsSparse
> =
  E extends CrunchesNumeric<number | bigint>
    ? TypedArrayFor<E>
    : Array<MaybeUndefined<E['_output'], IsSparse>>

function isNumeric(codec: CrunchesType<unknown, unknown>): codec is CrunchesNumeric<number | bigint> {
  return codec instanceof CrunchesNumeric
}

function canBeEncodedAsTypedArray(codec: CrunchesType<any>, wasSparseRequested: boolean, value: any) {
  const { elementClass } = codec as any
  return (
    elementClass
    && (!wasSparseRequested || ((BigInt64Array !== elementClass) && (BigUint64Array !== elementClass)))
    && false !== codec.isLittleEndian
    && (Array.isArray(value) || ArrayBuffer.isView(value))
  )
}

export class CrunchesArray<
  E extends CrunchesType<any>,
  IsSparse extends boolean = false
>
  extends CrunchesType<CrunchesArrayOutput<E, IsSparse>, CrunchesArrayInput<E, IsSparse>>
{

  $$elementCodec: CrunchesType<unknown>
  $$elementClass: TypedArrayConstructor | undefined
  $$isDenseCodec: CrunchesBoolean
  $$isPossiblySparse: boolean
  $$length: number
  $$presenceCodec: IsSparse extends true ? CrunchesArray<CrunchesUint8> : undefined

  constructor({ element, length = 0, sparse = false as IsSparse }: { element: E; length?: number; sparse?: IsSparse }) {
    super()
    this.$$elementCodec = element
    const elementClass = isNumeric(element) ? element.elementClass : undefined
    this.$$elementClass = elementClass
    this.$$isDenseCodec = boolean()
    this.$$isPossiblySparse = sparse
    this.$$presenceCodec = (sparse ? array({ element: uint8() }) : undefined) as any
    this.$$length = length
  }

  bigEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.bigEndian()
    }
    this.$$isDenseCodec.bigEndian()
    this.$$presenceCodec?.bigEndian()
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target) {
    let length: number
    if (0 === this.$$length) {
      length = view.getUint32(target.byteOffset, this.isLittleEndian ?? true)
      target.byteOffset += 4
    }
    else {
      length = this.$$length;
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
    // static shape
    if (
      this.$$elementClass
      && (!this.$$isPossiblySparse || ((BigInt64Array !== this.$$elementClass) && (BigUint64Array !== this.$$elementClass)))
    ) {
      target.byteOffset += this.$$elementCodec.padding(target.byteOffset)
      const value = new this.$$elementClass(view.buffer as ArrayBuffer, view.byteOffset + target.byteOffset, length)
      target.byteOffset += this.$$elementClass.BYTES_PER_ELEMENT * length
      return value as CrunchesArrayOutput<E, IsSparse>
    }
    // dynamic shape
    else {
      const value: Array<E['_output']> = Array(length)
      for (let i = 0; i < length; ++i) {
        value[i] = this.$$elementCodec.decodeFrom(view, target)
      }
      return value as CrunchesArrayOutput<E, IsSparse>
    }
  }

  encodeInto(value: CrunchesArrayInput<E, IsSparse>, view: DataView, byteOffset: number) {
    let written = 0
    let isDense = true
    if (this.$$isPossiblySparse && !canBeEncodedAsTypedArray(this.$$elementCodec, this.$$isPossiblySparse, value)) {
      for (const element of value) {
        if (undefined === element) {
          isDense = false
          break
        }
      }
    }
    if (0 === this.$$length) {
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
        if (this.$$elementClass) {
          written += this.$$elementCodec.padding(byteOffset + written)
        }
        // TypedArray
        if (canBeEncodedAsTypedArray(this.$$elementCodec, this.$$isPossiblySparse, value)) {
          length = (value as E['_input']).length
          new this.$$elementClass!(
            view.buffer as ArrayBuffer,
            view.byteOffset + byteOffset + written,
            length,
          ).set(Array.isArray(value) ? new this.$$elementClass!(value) : value as any)
          written += this.$$elementClass!.BYTES_PER_ELEMENT * length
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
        for (let i = 0; i < this.$$length; ++i) {
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
        if (this.$$elementClass) {
          written += this.$$elementCodec.padding(byteOffset + written)
        }
        // TypedArray
        if (canBeEncodedAsTypedArray(this.$$elementCodec, this.$$isPossiblySparse, value)) {
          new this.$$elementClass!(
            view.buffer as ArrayBuffer,
            view.byteOffset + byteOffset + written,
            this.$$length,
          ).set(Array.isArray(value) ? new this.$$elementClass!(value) : value as any)
          written += this.$$elementClass!.BYTES_PER_ELEMENT * this.$$length
        }
        // dynamic shape, big endian, iterator
        else {
          let protocol = value[Symbol.iterator]()
          let result = protocol.next()
          for (let i = 0; i < this.$$length; ++i) {
            written += this.$$elementCodec.encodeInto(result.value, view, byteOffset + written)
            result = protocol.next()
          }
        }
      }
    }
    return written;
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
    let isDense = true
    let size = 0
    if (this.$$isPossiblySparse && !canBeEncodedAsTypedArray(this.$$elementCodec, this.$$isPossiblySparse, value)) {
      for (const element of value) {
        if (undefined === element) {
          isDense = false
          break
        }
      }
    }
    // varlen
    if (0 === this.$$length) {
      size += 4 // length
      if (this.$$isPossiblySparse) {
        size += 1 // isDense
      }
      // sparse
      if (!isDense) {
        let i = 0
        for (const element of value) {
          if (undefined !== element) {
            size += this.$$elementCodec.sizeOf(element, size + byteOffset)
          }
          i += 1
        }
        size += 4 + Math.ceil(i / 8)
      }
      else {
        if (this.$$elementClass) {
          size += this.$$elementCodec.padding(byteOffset + size)
        }
        // TypedArray
        if (canBeEncodedAsTypedArray(this.$$elementCodec, this.$$isPossiblySparse, value)) {
          if (Array.isArray(value)) {
            return size + value.length * this.$$elementClass!.BYTES_PER_ELEMENT
          }
          if (value instanceof Set) {
            return size + value.size * this.$$elementClass!.BYTES_PER_ELEMENT
          }
          for (const element of value) {
            size += this.$$elementCodec.sizeOf(element, byteOffset + size)
          }
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
        for (let i = 0; i < this.$$length; ++i) {
          if (undefined !== result.value) {
            size += this.$$elementCodec.sizeOf(result.value, size + byteOffset)
          }
          result = protocol.next()
        }
        size += 4 + Math.ceil(this.$$length / 8)
      }
      else {
        if (this.$$elementClass) {
          size += this.$$elementCodec.padding(byteOffset + size)
        }
        // TypedArray
        if (canBeEncodedAsTypedArray(this.$$elementCodec, this.$$isPossiblySparse, value)) {
          size += this.$$length * this.$$elementClass!.BYTES_PER_ELEMENT
        }
        // iterable
        else {
          let protocol = value[Symbol.iterator]()
          let result = protocol.next()
          for (let i = 0; i < this.$$length; ++i) {
            size += this.$$elementCodec.sizeOf(result.value, size + byteOffset)
            result = protocol.next()
          }
        }
      }
    }
    return size
  }

}

export function array<
  E extends CrunchesType<any>,
  IsSparse extends boolean = false
>(
  options: { element: E; length?: number, sparse?: IsSparse }
) {
  return new CrunchesArray(options)
}
