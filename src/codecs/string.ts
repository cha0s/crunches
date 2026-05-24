import { CrunchesType, type Target } from '#types'

import { CrunchesUint32 } from './uint32.ts'
import { CrunchesVarUint } from './varuint.ts'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

export class CrunchesString extends CrunchesType<string> {

  prefix: CrunchesUint32 | CrunchesVarUint

  constructor({ varuint = false }: { varuint?: boolean } = {}) {
    super()
    this.prefix = varuint ? new CrunchesVarUint() : new CrunchesUint32()
  }

  bigEndian(): this {
    if (undefined === this.prefix.isLittleEndian) {
      this.prefix.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target) {
    const length = this.prefix.decodeFrom(view, target)
    if (0 === length) {
      return ''
    }
    const stringView = new Uint8Array(view.buffer, view.byteOffset + target.byteOffset, length)
    target.byteOffset += length
    return decoder.decode(stringView)
  }

  encodeInto(value: string, view: DataView, byteOffset: number) {
    const prefixLength = this.prefix.sizeOf(value.length * 3)
    const {written} = encoder.encodeInto(
      value,
      new Uint8Array(view.buffer, view.byteOffset + byteOffset + prefixLength),
    )
    this.prefix.encodeInto(written, view, byteOffset)
    return prefixLength + written
  }

  littleEndian(): this {
    if (undefined === this.prefix.isLittleEndian) {
      this.prefix.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(value: string) {
    return this.prefix.sizeOf(value.length * 3) + (encoder.encode(value)).length
  }

}

export const string = (options: { varuint?: boolean } = {}) => new CrunchesString(options)
