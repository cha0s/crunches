import { CrunchesNumeric, type Target } from '#types'

/**
 * 32-bit unsigned integer codec.
 */
export class CrunchesUint32 extends CrunchesNumeric {
  readonly byteWidth = 4
  readonly typedArray = Uint32Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getUint32(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 4
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setUint32(byteOffset, value, this.isLittleEndian ?? true)
    return 4
  }
  sizeOf() {
    return 4
  }
}

/**
 * Create 32-bit unsigned integer codec.
 */
export const uint32 = () => new CrunchesUint32()
