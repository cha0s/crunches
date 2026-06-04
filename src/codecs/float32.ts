import { CrunchesNumeric, type Target } from '#types'

export class CrunchesFloat32 extends CrunchesNumeric {
  readonly byteWidth = 4
  readonly typedArray = Float32Array
  decodeFrom(view: DataView, target: Target) {
    const value = view.getFloat32(target.byteOffset, this.isLittleEndian ?? true)
    target.byteOffset += 4
    return value
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    view.setFloat32(byteOffset, value, this.isLittleEndian ?? true)
    return 4
  }
  sizeOf() {
    return 4
  }
}

export const float32 = () => new CrunchesFloat32()
