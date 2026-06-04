import { CrunchesNumeric, type Target } from '#types'

export class CrunchesInt32 extends CrunchesNumeric {
  readonly byteWidth = 4
  readonly typedArray = Int32Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getInt32(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 4
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setInt32(byteOffset, value, this.isLittleEndian ?? true)
    return 4
  }
  sizeOf() {
    return 4
  }
}

export const int32 = () => new CrunchesInt32()
