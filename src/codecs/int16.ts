import { CrunchesNumeric, type Target } from '#types'

/**
 * 16-bit signed integer codec.
 */
export class CrunchesInt16 extends CrunchesNumeric {
  readonly byteWidth = 2
  readonly typedArray = Int16Array
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

/**
 * Create 16-bit signed integer codec.
 */
export const int16 = () => new CrunchesInt16()
