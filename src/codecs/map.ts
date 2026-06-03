import { CrunchesType, type Target } from '#types'

import { CrunchesArray } from './array.ts'
import { CrunchesObject } from './object.ts'

export class CrunchesMap <
  K extends CrunchesType<unknown, unknown>,
  V extends CrunchesType<unknown, unknown>
>
  extends CrunchesType<
    Map<K['_output'], V['_output']>,
    Map<K['_input'], V['_input']> | Iterable<Iterable<K['_input'] | V['_input']>>
  >
{

  protected $$array: CrunchesArray<CrunchesObject<{ key: K; value: V }>>

  constructor({ key, value }: { key: K; value: V; }) {
    super()
    this.$$array = new CrunchesArray({
      element: new CrunchesObject({ key, value }),
    })
  }

  bigEndian(): this {
    if (undefined === this.$$array.isLittleEndian) {
      this.$$array.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target): Map<K['_output'], V['_output']> {
    const result = new Map<K['_output'], V['_output']>()
    for (const { key, value } of this.$$array.decodeFrom(view, target) as Array<{ key: K['_output']; value: V['_output'] }>) {
      result.set(key, value)
    }
    return result
  }

  encodeInto(
    value: Map<K['_input'], V['_input']> | Iterable<Iterable<K['_input'] | V['_input']>>,
    view: DataView,
    byteOffset: number,
  ): number {
    const entries: Array<{ key: K['_input']; value: V['_input'] }> = []
    for (const [k, v] of value as Iterable<[K['_input'], V['_input']]>) {
      entries.push({ key: k, value: v })
    }
    return this.$$array.encodeInto(entries as any, view, byteOffset)
  }

  littleEndian(): this {
    if (undefined === this.$$array.isLittleEndian) {
      this.$$array.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(
    value: Map<K['_input'], V['_input']> | Iterable<Iterable<K['_input'] | V['_input']>>,
    byteOffset: number
  ): number {
    const entries: Array<{ key: K['_input']; value: V['_input'] }> = []
    for (const [k, v] of value as Iterable<[K['_input'], V['_input']]>) {
      entries.push({ key: k, value: v })
    }
    return this.$$array.sizeOf(entries as any, byteOffset)
  }

}

export function map<
  K extends CrunchesType<unknown, unknown>,
  V extends CrunchesType<unknown, unknown>
>(options: { key: K; value: V }) {
  return new CrunchesMap(options)
}
