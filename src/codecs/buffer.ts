import { CrunchesType, type Target } from '#types'

import { CrunchesUint32 } from './uint32.ts'
import { CrunchesVarUint } from './varuint.ts'

export class CrunchesBuffer extends CrunchesType<DataView, ArrayBufferLike> {

  prefix: CrunchesUint32 | CrunchesVarUint

  constructor({ varuint = false }: { varuint?: boolean } = {}) {
    super()
    this.prefix = varuint ? new CrunchesVarUint() : new CrunchesUint32()
  }

  decodeFrom(view: DataView, target: Target) {
    const length = this.prefix.decodeFrom(view, target)
    const value = new DataView(view.buffer, view.byteOffset + target.byteOffset, length)
    target.byteOffset += length
    return value
  }

  encodeInto(value: ArrayBufferLike, view: DataView, byteOffset: number) {
    const prefixLength = this.prefix.encodeInto(value.byteLength, view, byteOffset)
    new Uint8Array(view.buffer, view.byteOffset)
      .set(new Uint8Array(value), byteOffset + prefixLength)
    return prefixLength + value.byteLength
  }

  sizeOf(value: ArrayBufferLike) {
    return this.prefix.sizeOf(value.byteLength) + value.byteLength
  }

}

export const buffer = (options: { varuint?: boolean } = {}) => new CrunchesBuffer(options)
