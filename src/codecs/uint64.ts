import { CrunchesNumeric, type Target } from '#types'

export class CrunchesUint64 extends CrunchesNumeric<bigint> {
  readonly byteWidth = 8
  readonly typedArray = BigUint64Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getBigUint64(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 8
    return value
  }
  encodeInto(value: bigint, view: DataView, byteOffset: number) {
    view.setBigUint64(byteOffset, value, this.isLittleEndian ?? true)
    return 8
  }
  sizeOf() {
    return 8
  }
}

export const uint64 = () => new CrunchesUint64()
