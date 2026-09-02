import { CrunchesType, type Target } from '#types'

import { CrunchesUint32 } from './uint32.ts'
import { CrunchesVarUint } from './varuint.ts'

const decoder = new TextDecoder()
const encoder = new TextEncoder()

function utf8ByteLength(value: string) {
  let length = 0
  for (let i = 0; i < value.length; ++i) {
    const code = value.charCodeAt(i)
    if (code < 0x80) {
      length += 1
    }
    else if (code < 0x800) {
      length += 2
    }
    else if (0xd800 <= code && code <= 0xdbff && i + 1 < value.length) {
      const next = value.charCodeAt(i + 1)
      length += (0xdc00 <= next && next <= 0xdfff) ? 4 : 3
      if (0xdc00 <= next && next <= 0xdfff) {
        i += 1
      }
    }
    else {
      length += 3
    }
  }
  return length
}

/**
 * String codec.
 */
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
    const size = utf8ByteLength(value)
    const prefixLength = this.prefix.sizeOf(size)
    const { written } = encoder.encodeInto(
      value,
      new Uint8Array(view.buffer, view.byteOffset + byteOffset + prefixLength),
    )
    this.prefix.encodeInto(size, view, byteOffset)
    return prefixLength + written
  }

  littleEndian(): this {
    if (undefined === this.prefix.isLittleEndian) {
      this.prefix.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(value: string) {
    return this.prefix.sizeOf(utf8ByteLength(value)) + utf8ByteLength(value)
  }

}

/**
 * Create string codec.
 * @param options Buffer options.
 * @param options.varuint Whether to use a varuint prefix (default: false).
 */
export const string = (options: { varuint?: boolean } = {}) => new CrunchesString(options)
