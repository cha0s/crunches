import { type Target } from '#types'

import { CrunchesVarUint } from './varuint.ts'

export class CrunchesVarInt extends CrunchesVarUint {
  decodeFrom(view: DataView, target: Target) {
    const varuint = super.decodeFrom(view, target)
    const half = Math.floor(varuint / 2)
    return varuint & 1 ? -half - 1 : half
  }
  encodeInto(value: number, view: DataView, byteOffset: number) {
    value *= 2
    return super.encodeInto(value < 0 ? -value - 1 : value, view, byteOffset)
  }
  sizeOf(value: number) {
    value *= 2
    return super.sizeOf(value < 0 ? -value - 1 : value)
  }
}

export const varint = () => new CrunchesVarInt()
