import { CrunchesNumeric, type Target } from '#types'

/**
 * Double-precision floating-point codec.
 */
export class CrunchesFloat64 extends CrunchesNumeric {
  readonly byteWidth = 8
  readonly typedArray = Float64Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getFloat64(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 8
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setFloat64(byteOffset, value, this.isLittleEndian ?? true)
    return 8
  }
  sizeOf() {
    return 8
  }
}

/**
 * Create double-precision floating-point codec.
 */
export const float64 = () => new CrunchesFloat64()
