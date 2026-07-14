import { CrunchesType, type Target } from '#types'

import { CrunchesString } from './string.ts'

export type CrunchesJSONOutput = (
  | boolean
  | null
  | number
  | string
  | CrunchesJSONOutput[]
  | { [key: string]: CrunchesJSONOutput }
)

export type CrunchesJSONInput = (
  | boolean
  | null
  | number
  | string
  | CrunchesJSONInput[]
  | { [key: string]: CrunchesJSONInput }
  | { toJSON: () => CrunchesJSONOutput }
)

interface CrunchesJsonOptions {
  replacer?: any
  reviver?: any
  space?: any
  varuint?: boolean
}

export class CrunchesJson extends CrunchesType<CrunchesJSONOutput, CrunchesJSONInput> {

  private readonly $$replacer: any
  private readonly $$reviver: any
  private readonly $$space: any
  private readonly $$string: CrunchesString

  constructor(options?: CrunchesJsonOptions) {
    super()
    this.$$replacer = options?.replacer
    this.$$reviver = options?.reviver
    this.$$space = options?.space
    this.$$string = new CrunchesString(options)
  }

  bigEndian(): this {
    if (undefined === this.$$string.isLittleEndian) {
      this.$$string.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target): CrunchesJSONOutput {
    return JSON.parse(this.$$string.decodeFrom(view, target), this.$$reviver)
  }

  encodeInto(value: CrunchesJSONInput, view: DataView, byteOffset: number) {
    return this.$$string.encodeInto(
      JSON.stringify(value, this.$$replacer, this.$$space),
      view,
      byteOffset,
    )
  }

  littleEndian(): this {
    if (undefined === this.$$string.isLittleEndian) {
      this.$$string.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(value: CrunchesJSONInput) {
    return this.$$string.sizeOf(JSON.stringify(value, this.$$replacer, this.$$space))
  }

}

export const json = (options?: CrunchesJsonOptions) => new CrunchesJson(options)
