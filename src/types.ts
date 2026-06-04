export type Target = {
  byteOffset: number
}

export abstract class CrunchesBase<Output, Input = Output> {

  declare _output: Output
  declare _input: Input
  isLittleEndian: boolean | undefined

  bigEndian(): this {
    this.isLittleEndian = false
    return this
  }

  abstract decodeFrom(view: DataView, target: Target): Output

  abstract encodeInto(value: Input, view: DataView, byteOffset: number): number

  littleEndian(): this {
    this.isLittleEndian = true
    return this
  }

  // the amount of padding necessary before writing this type at `byteOffset`
  padding(_byteOffset: number): number { return 0 }

  abstract sizeOf(value: Input, byteOffset: number): number
}

export abstract class CrunchesType<Output, Input = Output> extends CrunchesBase<Output, Input> {

  declare readonly $$nonOptional: true

  allocate(value: Input) {
    return new DataView(new ArrayBuffer(this.size(value)))
  }

  decode(view: DataView) {
    return this.decodeFrom(view, { byteOffset: 0 })
  }

  encode(value: Input) {
    const view = this.allocate(value)
    this.encodeInto(value, view, 0)
    return view
  }

  optional(): CrunchesOptional<this> {
    return new CrunchesOptional(this)
  }

  size(value: Input) {
    return this.sizeOf(value, 0)
  }

}

export class CrunchesOptional<Inner extends CrunchesType<unknown, unknown>>
  extends CrunchesBase<Inner['_output'] | undefined, Inner['_input'] | undefined>
{
  readonly inner: Inner

  constructor(inner: Inner) {
    super()
    this.inner = inner
  }

  decodeFrom(view: DataView, target: Target) {
    return this.inner.decodeFrom(view, target)
  }

  encodeInto(value: Inner['_input'] | undefined, view: DataView, byteOffset: number) {
    return this.inner.encodeInto(value, view, byteOffset)
  }

  sizeOf(value: Inner['_input'] | undefined, byteOffset: number) {
    return this.inner.sizeOf(value, byteOffset)
  }
}

export type Infer<T extends CrunchesBase<unknown, unknown>> = T['_output']
export type InferInput<T extends CrunchesBase<unknown, unknown>> = T['_input']

export type TypedArrayConstructor =
  | typeof Int8Array
  | typeof Uint8Array
  | typeof Int16Array
  | typeof Uint16Array
  | typeof Int32Array
  | typeof Uint32Array
  | typeof Float32Array
  | typeof Float64Array
  | typeof BigInt64Array
  | typeof BigUint64Array

export abstract class CrunchesNumeric<Output extends number | bigint = number>
  extends CrunchesType<Output> {
  abstract readonly byteWidth: number
  abstract readonly typedArray: TypedArrayConstructor
  // TypedArray requires padding to align with element width
  padding(byteOffset: number): number {
    if (0 === this.byteWidth) return 0
    const extra = byteOffset & (this.byteWidth - 1)
    return extra === 0 ? 0 : this.byteWidth - extra
  }
}
