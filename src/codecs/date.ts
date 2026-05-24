import { CrunchesType, type Target } from '#types'

import { CrunchesString } from './string.ts'

type CoercibleToDate = Date | string | number

export class CrunchesDate extends CrunchesType<Date, CoercibleToDate> {
  private readonly $$string: CrunchesString

  constructor(options?: { varuint?: boolean }) {
    super()
    this.$$string = new CrunchesString(options)
    this.$$string.isLittleEndian = this.isLittleEndian
  }

  decodeFrom(view: DataView, target: Target): Date {
    return new Date(this.$$string.decodeFrom(view, target))
  }

  encodeInto(value: CoercibleToDate, view: DataView, byteOffset: number): number {
    return this.$$string.encodeInto(new Date(value).toISOString(), view, byteOffset)
  }

  sizeOf(value: CoercibleToDate): number {
    return this.$$string.sizeOf(new Date(value).toISOString())
  }
}

export const date = (options?: { varuint?: boolean }) => new CrunchesDate(options)
