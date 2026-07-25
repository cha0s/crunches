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

export interface CrunchesJsonOptions {
  /**
   * A function that alters the behavior of the stringification process.
   */
  replacer?: any
  /**
   * Prescribes how each value originally produced by parsing is transformed before being returned.
   */
  reviver?: any
  /**
   * A string or number that's used to insert white space.
   */
  space?: any
  /**
   * Whether to use a varuint prefix (default: false).
   */
  varuint?: boolean
}

/**
 * JSON codec.
 */
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

/**
 * Create JSON codec.
 * @param options JSON options.
 * @param options.replacer A function that alters the behavior of the stringification process.
 * @param options.reviver Prescribes how each value originally produced by parsing is transformed before being returned.
 * @param options.space A string or number that's used to insert white space.
 * @param options.varuint Whether to use a varuint prefix (default: false).
 */
export const json = (options?: CrunchesJsonOptions) => new CrunchesJson(options)
