import {
  CrunchesType,
  CrunchesOptional,
  CrunchesBase,
  type Target,
} from '#types'

import { CrunchesBoolean } from './boolean.ts'

type Props = Record<string, CrunchesBase<any>>

type RequiredKeys<P extends Props> = {
  [K in keyof P]: P[K] extends CrunchesOptional<any> ? never : K
}[keyof P]

type OptionalKeys<P extends Props> = {
  [K in keyof P]: P[K] extends CrunchesOptional<any> ? K : never
}[keyof P]

export type InferObjectOutput<P extends Props> =
  { [K in RequiredKeys<P>]:  P[K]['_output'] } &
  { [K in OptionalKeys<P>]?: Exclude<P[K]['_output'], undefined> }

export type InferObjectInput<P extends Props> =
  { [K in RequiredKeys<P>]:  P[K]['_input'] } &
  { [K in OptionalKeys<P>]?: Exclude<P[K]['_input'], undefined> }

type ObjectDecodeFunc<P extends Record<string, CrunchesBase<unknown, unknown>>> =
  (view: DataView, target: Target) => InferObjectOutput<P>

type ObjectEncodeFunc<P extends Record<string, CrunchesBase<unknown, unknown>>> =
  (value: InferObjectInput<P>, view: DataView, byteOffset: number) => number

type DeepOptional<P extends Record<string, CrunchesBase<unknown, unknown>>> = {
  [K in keyof P]: P[K] extends CrunchesObject<infer Inner>
    ? CrunchesOptional<CrunchesObject<DeepOptional<Inner>>>
    : P[K] extends CrunchesOptional<any>
      ? P[K]
      : CrunchesOptional<P[K] extends CrunchesType<unknown, unknown> ? P[K] : never>
}

export class CrunchesObject<P extends Record<string, CrunchesBase<unknown, unknown>>>
  extends CrunchesType<InferObjectOutput<P>, InferObjectInput<P>>
{

  readonly props: P

  $$booleans = 0
  $$codecs: CrunchesBase<any>[] = []
  $$decodeFrom!: ObjectDecodeFunc<P>
  $$encodeInto!: ObjectEncodeFunc<P>
  $$optionals = 0
  $$sizeOf!: (value: InferObjectInput<P>, byteOffset: number) => number

  constructor(props: P) {
    super()
    this.props = props

    let encoderCode = ''
    let decoderCode = `
      const value = {}
    `
    let i = 0
    for (const key in props) {
      const property = props[key]
      const sanitizedKey = JSON.stringify(key)
      const codec = property instanceof CrunchesOptional ? property.inner : property
      if (property instanceof CrunchesOptional) {
        this.$$optionals += 1
        decoderCode += `
          if (!(optionalFlags[currentOptional >> 3] & (1 << (currentOptional & 7)))) {
            ${(codec instanceof CrunchesBoolean) ? '$$booleans -= 1' : ''}
          }
          else {
        `
        encoderCode += `
          isPresent = 'undefined' !== typeof value[${sanitizedKey}]
          optionalFlags[currentOptional >> 3] |= (isPresent ? 1 : 0) << (currentOptional & 7)
          currentOptional += 1
          if (isPresent) {
        `
      }
      if (codec instanceof CrunchesBoolean) {
        this.$$booleans += 1
        decoderCode += `
          booleanBackpatches.push({ bit: currentBoolean & 7, index: currentBoolean >> 3, key: ${sanitizedKey} })
          currentBoolean += 1
        `
        encoderCode += `
          booleanFlags[currentBoolean >> 3] |= (value[${sanitizedKey}] ? 1 : 0) << (currentBoolean & 7)
          currentBoolean += 1
        `
      }
      else {
        decoderCode += `value[${sanitizedKey}] = this.$$codecs[${i}].decodeFrom(view, target);`
        encoderCode += `written += this.$$codecs[${i}].encodeInto(value[${sanitizedKey}], view, byteOffset + written);`
      }
      if (property instanceof CrunchesOptional) {
        decoderCode += `
          }
          currentOptional += 1
        `
        encoderCode += '}'
      }
      this.$$codecs.push(codec)
      i += 1
    }
    if (this.$$booleans > 0) {
      decoderCode = `
        let currentBoolean = 0
        let {$$booleans} = this
        const booleanBackpatches = []
      ` + decoderCode
      decoderCode += `
        const booleanFlags = []
        const booleanCount = Math.ceil($$booleans / 8)
        if (booleanCount > 0) {
          for (let i = 0; i < booleanCount; ++i) {
            booleanFlags.push(view.getUint8(target.byteOffset))
            target.byteOffset += 1
          }
          for (const { bit, index, key } of booleanBackpatches) {
            value[key] = !!(booleanFlags[index] & (1 << bit))
          }
        }
      `
      encoderCode += `
        for (let i = 0; i < booleanFlags.length; ++i) {
          view.setUint8(byteOffset + written + i, booleanFlags[i])
        }
        written += booleanFlags.length
      `
      encoderCode = `
        const booleanFlags = []
        let currentBoolean = 0
      ` + encoderCode
    }
    if (this.$$optionals > 0) {
      decoderCode = `
        const optionalFlags = []
        let currentOptional = 0
        const optionalCount = Math.ceil(this.$$optionals / 8)
        for (let i = 0; i < optionalCount; ++i) {
          optionalFlags.push(view.getUint8(target.byteOffset))
          target.byteOffset += 1
        }
      ` + decoderCode
      encoderCode += `
        for (let i = 0; i < optionalFlags.length; ++i) {
          view.setUint8(byteOffset + i, optionalFlags[i])
        }
      `
      encoderCode = `
        const optionalFlags = []
        let currentOptional = 0
        let isPresent
        written += Math.ceil(this.$$optionals / 8)
      ` + encoderCode
    }
    encoderCode = `
      let written = 0
    ` + encoderCode
    encoderCode += `
      return written
    `
    decoderCode += 'return value'
    this.$$decodeFrom = new Function('view, target', decoderCode) as ObjectDecodeFunc<P>
    this.$$encodeInto = new Function('value, view, byteOffset', encoderCode) as ObjectEncodeFunc<P>
    this.$$sizeOf = (value: InferObjectInput<P>, byteOffset: number) => {
      let {$$booleans} = this
      let size = 0
      size += Math.ceil(this.$$optionals / 8)
      let i = 0
      for (const key in props) {
        const codec = this.$$codecs[i]
        const property = props[key]
        if ((property instanceof CrunchesOptional) && 'undefined' === typeof (value as Record<string, unknown>)[key]) {
          if (codec instanceof CrunchesBoolean) {
            $$booleans -= 1
          }
          i += 1
          continue
        }
        if (!(codec instanceof CrunchesBoolean)) {
          size += codec.sizeOf((value as Record<string, unknown>)[key], byteOffset + size)
        }
        i += 1
      }
      size += Math.ceil($$booleans / 8)
      return size
    }

  }

  bigEndian(): this {
    for (const codec of this.$$codecs) {
      if (undefined === codec.isLittleEndian) {
        codec.bigEndian()
      }
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target) {
    return this.$$decodeFrom(view, target)
  }

  deepOptional(): CrunchesObject<DeepOptional<P>> {
    const newProps: Record<string, CrunchesBase<unknown, unknown>> = {}
    for (const key in this.props) {
      const prop = this.props[key]
      if (prop instanceof CrunchesOptional) {
        newProps[key] = prop
      }
      else if (prop instanceof CrunchesObject) {
        newProps[key] = prop.deepOptional().optional()
      }
      else {
        newProps[key] = (prop as unknown as CrunchesType<unknown, unknown>).optional()
      }
    }
    return object(newProps as DeepOptional<P>)
  }

  encodeInto(value: InferObjectInput<P>, view: DataView, byteOffset: number) {
    return this.$$encodeInto(value, view, byteOffset)
  }

  littleEndian(): this {
    for (const codec of this.$$codecs) {
      if (undefined === codec.isLittleEndian) {
        codec.littleEndian()
      }
    }
    return super.littleEndian()
  }

  sizeOf(value: InferObjectInput<P>, byteOffset: number) {
    return this.$$sizeOf(value, byteOffset)
  }

}

export const object = <P extends Record<string, CrunchesBase<unknown, unknown>>>(props: P) =>
  new CrunchesObject(props)
