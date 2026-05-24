import { CrunchesType, type Target } from '#types'

export class CrunchesBoolean extends CrunchesType<boolean, any> {
  decodeFrom(view: DataView, target: Target) {
    const value = !!view.getUint8(target.byteOffset)
    target.byteOffset += 1
    return value
  }
  encodeInto(value: any, view: DataView, byteOffset: number) {
    view.setUint8(byteOffset, value ? 1 : 0)
    return 1
  }
  sizeOf() {
    return 1
  }
}

export const boolean = () => new CrunchesBoolean()
