import { CrunchesNumeric, type Target } from '#types'

export class CrunchesUint16 extends CrunchesNumeric {
  readonly byteWidth = 2
  readonly elementClass = Uint16Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getUint16(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 2
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setUint16(byteOffset, value, this.isLittleEndian ?? true)
    return 2
  }
  sizeOf() {
    return 2
  }
}

export const uint16 = () => new CrunchesUint16()
