import { CrunchesType, type Target } from '#types'

import { CrunchesArray, type CrunchesArrayInput } from './array.ts'

type ExtractIterable<T> = T extends Iterable<infer V, any, any> ? V : never

type MapValueMaybeUndefined<T, IsSparse> = IsSparse extends true
  ? T | undefined
  : T

export class CrunchesMap <
  K extends CrunchesType<unknown, unknown>,
  V extends CrunchesType<unknown, unknown>,
  IsSparse extends boolean = false
>
  extends CrunchesType<
    Map<K['_output'], MapValueMaybeUndefined<V['_output'], IsSparse>>,
    Map<K['_input'], MapValueMaybeUndefined<V['_input'], IsSparse>> | Iterable<[K['_input'], MapValueMaybeUndefined<V['_input'], IsSparse>]>
  >
{

  $$keyCodec: CrunchesArray<K, IsSparse>
  $$valueCodec: CrunchesArray<V, IsSparse>

  constructor({ key, value, sparse = false as IsSparse }: { key: K; value: V; sparse?: IsSparse }) {
    super()
    this.$$keyCodec = new CrunchesArray({ element: key })
    this.$$valueCodec = new CrunchesArray({ element: value, sparse })
  }

  bigEndian(): this {
    if (undefined === this.$$keyCodec.isLittleEndian) {
      this.$$keyCodec.bigEndian()
    }
    if (undefined === this.$$valueCodec.isLittleEndian) {
      this.$$valueCodec.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target): Map<K['_output'], V['_output'] | undefined> {
    const result = new Map<K['_output'], V['_output']>()
    const keys = this.$$keyCodec.decodeFrom(view, target)
    this.$$valueCodec.length = keys.length
    const values = this.$$valueCodec.decodeFrom(view, target)
    for (let i = 0; i < keys.length; ++i) {
      result.set(keys[i], values[i])
    }
    return result
  }

  encodeInto(
    value: Map<K['_input'], V['_input'] | undefined> | Iterable<[K['_input'], V['_input'] | undefined]>,
    view: DataView,
    byteOffset: number,
  ): number {
    const keys: ExtractIterable<CrunchesArrayInput<K, IsSparse>>[] = []
    const values: ExtractIterable<CrunchesArrayInput<V, IsSparse>>[] = []
    for (const [k, v] of value as Iterable<[typeof keys[number], typeof values[number]]>) {
      keys.push(k)
      values.push(v)
    }
    let written = 0
    written += this.$$keyCodec.encodeInto(keys, view, written + byteOffset)
    this.$$valueCodec.length = keys.length
    written += this.$$valueCodec.encodeInto(values, view, written + byteOffset)
    return written
  }

  littleEndian(): this {
    if (undefined === this.$$keyCodec.isLittleEndian) {
      this.$$keyCodec.littleEndian()
    }
    if (undefined === this.$$valueCodec.isLittleEndian) {
      this.$$valueCodec.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(
    value: Map<K['_input'], V['_input'] | undefined> | Iterable<[K['_input'], V['_input'] | undefined]>,
    byteOffset: number
  ): number {
    const keys: ExtractIterable<CrunchesArrayInput<K, IsSparse>>[] = []
    const values: ExtractIterable<CrunchesArrayInput<V, IsSparse>>[] = []
    for (const [k, v] of value as Iterable<[typeof keys[number], typeof values[number]]>) {
      keys.push(k)
      values.push(v)
    }
    let size = 0
    size += this.$$keyCodec.sizeOf(keys, size + byteOffset)
    this.$$valueCodec.length = keys.length
    size += this.$$valueCodec.sizeOf(values, size + byteOffset)
    return size
  }

}

export function map<
  K extends CrunchesType<unknown, unknown>,
  V extends CrunchesType<unknown, unknown>,
  IsSparse extends boolean = false
>(options: { key: K; value: V, sparse?: IsSparse }) {
  return new CrunchesMap(options)
}
