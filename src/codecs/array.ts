import {
  CrunchesType,
  CrunchesNumeric,
  type Target,
  type TypedArrayConstructor,
} from '#types'

type TypedArrayFor<E extends CrunchesNumeric<number | bigint>> =
  InstanceType<E['elementClass']>

// input type: any iterable of the element's input type
export type CrunchesArrayInput<E extends CrunchesType<unknown, unknown>> =
  Iterable<E extends CrunchesNumeric<infer N> ? N : E['_input']>

// output type: TypedArray for numeric elements, regular array otherwise
export type CrunchesArrayOutput<E extends CrunchesType<unknown, unknown>> =
  E extends CrunchesNumeric<number | bigint> ? TypedArrayFor<E> : Array<E['_output']>

function isNumeric(codec: CrunchesType<unknown, unknown>): codec is CrunchesNumeric<number | bigint> {
  return codec instanceof CrunchesNumeric
}

export class CrunchesArray<E extends CrunchesType<any>>
  extends CrunchesType<CrunchesArrayOutput<E>, CrunchesArrayInput<E>>
{

  $$elementByteWidth: number
  $$elementCodec: CrunchesType<unknown>
  $$elementClass: TypedArrayConstructor | undefined
  $$length: number
  $$sizeOf!: (value: CrunchesArrayInput<E>, byteOffset: number) => number

  constructor({ element, length = 0 }: { element: E; length?: number }) {
    super()
    this.$$elementCodec = element
    this.$$elementByteWidth = isNumeric(element) ? element.byteWidth : 0
    this.$$elementClass = isNumeric(element) ? element.elementClass : undefined
    this.$$length = length
    const elementClass = this.$$elementClass
    // varlen
    if (0 === length) {
      if (elementClass) {
        this.$$sizeOf = (value, byteOffset) => {
          let size = 4 + this.$$elementCodec.padding(byteOffset + 4)
          if (Array.isArray(value)) {
            return size + value.length * elementClass.BYTES_PER_ELEMENT
          }
          if (value instanceof Set) {
            return size + value.size * elementClass.BYTES_PER_ELEMENT
          }
          for (const element of value) {
            size += this.$$elementCodec.sizeOf(element, byteOffset + size)
          }
          return size
        }
      }
      else {
        this.$$sizeOf = (value, byteOffset) => {
          let size = 4
          for (const element of value) {
            size += this.$$elementCodec.sizeOf(element, size + byteOffset)
          }
          return size
        }
      }
    }
    // fixed
    else {
      if (elementClass) {
        this.$$sizeOf = (_value, byteOffset) => {
          return this.$$elementCodec.padding(byteOffset) + length * elementClass.BYTES_PER_ELEMENT
        }
      }
      else {
        this.$$sizeOf = (value, byteOffset) => {
          let size = 0
          // let the environment report
          /* v8 ignore next 3 */
          if (!value[Symbol.iterator]) {
            for (const _ of value) {/* ... */} // eslint-disable-line no-unused-vars
          }
          let protocol = value[Symbol.iterator]()
          let result = protocol.next()
          for (let i = 0; i < length; ++i) {
            size += this.$$elementCodec.sizeOf(result.value, size + byteOffset)
            result = protocol.next()
          }
          return size
        }
      }
    }
  }

  bigEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target) {
    let length: number
    if (0 === this.$$length) {
      length = view.getUint32(target.byteOffset, this.isLittleEndian ?? true)
      target.byteOffset += 4
      target.byteOffset += this.$$elementCodec.padding(target.byteOffset)
    }
    else {
      length = this.$$length;
    }
    // static shape
    if (this.$$elementClass) {
      target.byteOffset += this.$$elementCodec.padding(target.byteOffset)
      const value = new this.$$elementClass(view.buffer as ArrayBuffer, view.byteOffset + target.byteOffset, length)
      target.byteOffset += this.$$elementClass.BYTES_PER_ELEMENT * length
      return value as CrunchesArrayOutput<E>
    }
    // dynamic shape
    else {
      const value: Array<E['_output']> = Array(length)
      for (let i = 0; i < length; ++i) {
        value[i] = this.$$elementCodec.decodeFrom(view, target)
      }
      return value as CrunchesArrayOutput<E>
    }
  }

  encodeInto(value: CrunchesArrayInput<E>, view: DataView, byteOffset: number) {
    if (0 === this.$$length) {
      let length = 0
      let written = 4 + this.$$elementCodec.padding(byteOffset + 4)
      // slow path (dynamic shape, big endian, iterator)
      if (
        !this.$$elementClass
        || false === this.$$elementCodec.isLittleEndian
        || (!Array.isArray(value) && !ArrayBuffer.isView(value))
      ) {
        for (const element of value) {
          length += 1
          written += this.$$elementCodec.encodeInto(element, view, byteOffset + written)
        }
      }
      // fast path (TypedArray)
      else {
        length = (value as E['_input']).length
        new this.$$elementClass(
          view.buffer as ArrayBuffer,
          view.byteOffset + byteOffset + written,
          length,
        ).set(Array.isArray(value) ? new this.$$elementClass(value) : value as any)
        written += this.$$elementClass.BYTES_PER_ELEMENT * length
      }
      view.setUint32(byteOffset, length, this.isLittleEndian ?? true)
      return written
    }
    else {
      let written = 0
      // slow path (dynamic shape, big endian, iterator)
      if (
        !this.$$elementClass
        || false === this.$$elementCodec.isLittleEndian
        || (!Array.isArray(value) && !ArrayBuffer.isView(value))
      ) {
        // let the environment report
        if (!value[Symbol.iterator]) {
          for (const _ of value) {/* ... */} // eslint-disable-line no-unused-vars
        }
        let protocol = value[Symbol.iterator]()
        let result = protocol.next()
        for (let i = 0; i < this.$$length; ++i) {
          written += this.$$elementCodec.encodeInto(result.value, view, byteOffset + written)
          result = protocol.next()
        }
      }
      // fast path (TypedArray)
      else {
        written += this.$$elementCodec.padding(byteOffset)
        new this.$$elementClass(
          view.buffer as ArrayBuffer,
          view.byteOffset + byteOffset + written,
          this.$$length,
        ).set(Array.isArray(value) ? new this.$$elementClass(value) : value as any)
        written += this.$$elementClass.BYTES_PER_ELEMENT * this.$$length
      }
      return written;
    }
  }

  littleEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(value: CrunchesArrayInput<E>, byteOffset: number) {
    return this.$$sizeOf(value, byteOffset)
  }

}

export function array<E extends CrunchesType<any>>(options: { element: E; length?: number }) {
  return new CrunchesArray(options)
}
