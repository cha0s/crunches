import { CrunchesType, type Target } from '#types'

export class CrunchesVarUint extends CrunchesType<number> {
  decodeFrom(view: DataView, target: Target) {
    const byte0 = view.getUint8(target.byteOffset)
    target.byteOffset += 1
    if (!(byte0 & 0x80)) return byte0

    const byte1 = view.getUint8(target.byteOffset)
    target.byteOffset += 1
    if (!(byte1 & 0x80)) return (byte0 & 0x7F) | ((byte1 & 0x7F) << 7)

    // general case
    let byte = byte1
    let shift = 14
    let value = (byte0 & 0x7F) | ((byte1 & 0x7F) << 7)
    do {
      byte = view.getUint8(target.byteOffset)
      target.byteOffset += 1
      value |= (byte & 0x7F) << shift
      shift += 7
    } while (byte & 0x80)
    return value >>> 0 // coerce to unsigned 32-bit
  }

  encodeInto(value: number, view: DataView, byteOffset: number) {
    if (value < 0x80) {
      view.setUint8(byteOffset, value)
      return 1
    }
    if (value < 0x4000) {
      view.setUint8(byteOffset, (value & 0x7F) | 0x80)
      view.setUint8(byteOffset + 1, value >>> 7)
      return 2
    }
    // general case
    let written = 0
    while (value > 0x7F) {
      view.setUint8(byteOffset + written, (value & 0x7F) | 0x80)
      written += 1
      value >>>= 7
    }
    view.setUint8(byteOffset + written, value)
    return written + 1
  }

  sizeOf(value: number) {
    if (value < 0x80) return 1
    if (value < 0x4000) return 2
    let size = 1
    while (value > 0x7F) {
      size += 1
      value >>>= 7
    }
    return size
  }
}

export const varuint = () => new CrunchesVarUint()