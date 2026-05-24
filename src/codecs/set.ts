import { CrunchesType, type Target } from '#types'

import { CrunchesArray } from './array.ts'

export class CrunchesSet<E extends CrunchesType<unknown, unknown>>
  extends CrunchesType<Set<E['_output']>, Set<E['_input']> | Iterable<E['_input']>>
{
  private readonly $$array: CrunchesArray<E>

  constructor({ element, length }: { element: E; length?: number }) {
    super()
    this.$$array = new CrunchesArray({ element, length })
  }

  decodeFrom(view: DataView, target: Target): Set<E['_output']> {
    const result = new Set<E['_output']>()
    for (const item of this.$$array.decodeFrom(view, target) as Array<E['_output']>) {
      result.add(item)
    }
    return result
  }

  encodeInto(
    value: Set<E['_input']> | Iterable<E['_input']>,
    view: DataView,
    byteOffset: number,
  ): number {
    const entries: Array<E['_input']> = []
    for (const item of value) {
      entries.push(item)
    }
    return this.$$array.encodeInto(entries as any, view, byteOffset)
  }

  sizeOf(
    value: Set<E['_input']> | Iterable<E['_input']>,
    byteOffset: number
  ): number {
    const entries: Array<E['_input']> = []
    for (const item of value) {
      entries.push(item)
    }
    return this.$$array.sizeOf(entries as any, byteOffset)
  }
}

export const set = <E extends CrunchesType<unknown, unknown>>(
  options: { element: E; length?: number }
) => new CrunchesSet(options)