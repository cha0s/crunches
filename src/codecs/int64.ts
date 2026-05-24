import { CrunchesNumeric, type Target } from '#types'

export class CrunchesInt64 extends CrunchesNumeric<bigint> {
  readonly byteWidth = 8
  readonly elementClass = BigInt64Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getBigInt64(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 8
    return value
  }
  encodeInto(value: bigint, view: DataView, byteOffset: number) {
    view.setBigInt64(byteOffset, value, this.isLittleEndian ?? true)
    return 8
  }
  sizeOf() {
    return 8
  }
}

export const int64 = () => new CrunchesInt64()
