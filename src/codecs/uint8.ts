import { CrunchesNumeric, type Target } from '#types'

export class CrunchesUint8 extends CrunchesNumeric {
  readonly byteWidth = 1
  readonly typedArray = Uint8Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getUint8(target.byteOffset)
    target.byteOffset += 1
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setUint8(byteOffset, value)
    return 1
  }
  sizeOf() {
    return 1
  }
}

export const uint8 = () => new CrunchesUint8
