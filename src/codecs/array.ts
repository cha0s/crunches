import {
  CrunchesType,
  CrunchesNumeric,
  type Target,
  type TypedArrayConstructor,
} from '#types'

type TypedArrayFor<E extends CrunchesNumeric<number | bigint>> =
  InstanceType<E['elementClass']>

// input type: any iterable of the element's input type
type ArrayInput<E extends CrunchesType<unknown, unknown>> =
  Iterable<E extends CrunchesNumeric<infer N> ? N : E['_input']>

// output type: TypedArray for numeric elements, regular array otherwise
type ArrayOutput<E extends CrunchesType<unknown, unknown>> =
  E extends CrunchesNumeric<number | bigint> ? TypedArrayFor<E> : Array<E['_output']>

function isNumeric(codec: CrunchesType<unknown, unknown>): codec is CrunchesNumeric<number | bigint> {
  return codec instanceof CrunchesNumeric
}

type ArrayDecodeFunc<E extends CrunchesType<unknown, unknown>> =
  (view: DataView, target: Target) => ArrayOutput<E>

type ArrayEncodeFunc<E extends CrunchesType<unknown, unknown>> =
  (value: ArrayInput<E>, view: DataView, byteOffset: number) => number

export class CrunchesArray<E extends CrunchesType<any>>
  extends CrunchesType<ArrayOutput<E>, ArrayInput<E>>
{

  $$decodeFrom!: ArrayDecodeFunc<E>
  $$elementByteWidth: number
  $$elementCodec: CrunchesType<unknown>
  $$elementClass: TypedArrayConstructor | undefined
  $$encodeInto!: ArrayEncodeFunc<E>
  $$sizeOf!: (value: ArrayInput<E>, byteOffset: number) => number

  constructor({ element, length = 0 }: { element: E; length?: number }) {
    super()
    this.$$elementCodec = element
    this.$$elementByteWidth = isNumeric(element) ? element.byteWidth : 0
    this.$$elementClass = isNumeric(element) ? element.elementClass : undefined
    const elementClass = this.$$elementClass
    let decoderCode = '', encoderCode = ''
    // varlen
    if (0 === length) {
      decoderCode += `
        const length = view.getUint32(target.byteOffset, this.isLittleEndian ?? true)
        target.byteOffset += 4
        target.byteOffset += this.$$elementCodec.padding(target.byteOffset)
      `
      encoderCode += `
        let length = 0
        let written = 4 + this.$$elementCodec.padding(byteOffset + 4)
      `
      if (elementClass) {
        encoderCode += `
          if ((false !== this.$$elementCodec.isLittleEndian) && (Array.isArray(value) || ArrayBuffer.isView(value))) {
            length = value.length
            new this.$$elementClass(
              view.buffer,
              view.byteOffset + byteOffset + written,
              length,
            ).set(Array.isArray(value) ? new this.$$elementClass(value) : value)
            written += this.$$elementClass.BYTES_PER_ELEMENT * length
          }
          else {
        `
      }
      encoderCode += `
        for (const element of value) {
          length += 1
          written += this.$$elementCodec.encodeInto(element, view, byteOffset + written)
        }
      `
      if (elementClass) {
        encoderCode += '}'
      }
      encoderCode += `
        view.setUint32(byteOffset, length, this.isLittleEndian ?? true)
        return written
      `
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
      decoderCode += `const length = ${length};`
      encoderCode += `let written = 0`
      if (elementClass) {
        encoderCode += `
          if ((false !== this.$$elementCodec.isLittleEndian) && (Array.isArray(value) || ArrayBuffer.isView(value))) {
            written += this.$$elementCodec.padding(byteOffset)
            new this.$$elementClass(
              view.buffer,
              view.byteOffset + byteOffset + written,
              ${length},
            ).set(Array.isArray(value) ? new this.$$elementClass(value) : value)
            written += this.$$elementClass.BYTES_PER_ELEMENT * ${length}
          }
          else {
        `
      }
      encoderCode += `
        // let the environment report
        if (!value[Symbol.iterator]) {
          for (const _ of value) {/* ... */} // eslint-disable-line no-unused-vars
        }
        let protocol = value[Symbol.iterator]()
        let result = protocol.next()
        for (let i = 0; i < ${length}; ++i) {
          written += this.$$elementCodec.encodeInto(result.value, view, byteOffset + written)
          result = protocol.next()
        }
      `
      if (elementClass) {
        encoderCode += '}'
      }
      encoderCode += 'return written;'
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
    // static shape
    if (elementClass) {
      decoderCode += `
        target.byteOffset += this.$$elementCodec.padding(target.byteOffset)
        const value = new this.$$elementClass(view.buffer, view.byteOffset + target.byteOffset, length)
        target.byteOffset += ${elementClass.BYTES_PER_ELEMENT} * length
      `
    }
    // dynamic shape
    else {
      decoderCode += `
        const value = Array(length)
        for (let i = 0; i < length; ++i) {
          value[i] = this.$$elementCodec.decodeFrom(view, target)
        }
      `
    }
    decoderCode += 'return value;'
    this.$$decodeFrom = new Function('view, target', decoderCode) as ArrayDecodeFunc<E>
    this.$$encodeInto = new Function('value, view, byteOffset', encoderCode) as ArrayEncodeFunc<E>
  }

  bigEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target) {
    return this.$$decodeFrom(view, target)
  }

  encodeInto(value: ArrayInput<E>, view: DataView, byteOffset: number) {
    return this.$$encodeInto(value, view, byteOffset)
  }

  littleEndian(): this {
    if (undefined === this.$$elementCodec.isLittleEndian) {
      this.$$elementCodec.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(value: ArrayInput<E>, byteOffset: number) {
    return this.$$sizeOf(value, byteOffset)
  }

}

export function array<E extends CrunchesType<any>>(options: { element: E; length?: number }) {
  return new CrunchesArray(options)
}
