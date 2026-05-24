import { CrunchesNumeric, type Target } from '#types'

export class CrunchesInt16 extends CrunchesNumeric {
  readonly byteWidth = 2
  readonly elementClass = Int16Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getInt16(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 2
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setInt16(byteOffset, value, this.isLittleEndian ?? true)
    return 2
  }
  sizeOf() {
    return 2
  }
}

export const int16 = () => new CrunchesInt16()
