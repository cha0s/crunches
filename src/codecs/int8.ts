import { CrunchesNumeric, type Target } from '#types'

export class CrunchesInt8 extends CrunchesNumeric {
  readonly byteWidth = 1
  readonly elementClass = Int8Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getInt8(target.byteOffset)
    target.byteOffset += 1
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setInt8(byteOffset, value)
    return 1
  }
  sizeOf() {
    return 1
  }
}

export const int8 = () => new CrunchesInt8()
