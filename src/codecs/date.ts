import { CrunchesType, type Target } from '#types'

import { CrunchesString } from './string.ts'

type CoercibleToDate = Date | string | number

export class CrunchesDate extends CrunchesType<Date, CoercibleToDate> {

  private readonly $$string: CrunchesString

  constructor(options?: { varuint?: boolean }) {
    super()
    this.$$string = new CrunchesString(options)
  }

  bigEndian(): this {
    this.$$string.bigEndian()
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target): Date {
    return new Date(this.$$string.decodeFrom(view, target))
  }

  encodeInto(value: CoercibleToDate, view: DataView, byteOffset: number): number {
    return this.$$string.encodeInto(new Date(value).toISOString(), view, byteOffset)
  }

  littleEndian(): this {
    this.$$string.littleEndian()
    return super.littleEndian()
  }

  sizeOf(value: CoercibleToDate): number {
    return this.$$string.sizeOf(new Date(value).toISOString())
  }
}

export const date = (options?: { varuint?: boolean }) => new CrunchesDate(options)
