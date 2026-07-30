export type Target = {
  /**
   * The offset from which to start decoding.
   */
  byteOffset: number
}

export abstract class CrunchesBase<Output, Input = Output> {

  declare _output: Output
  declare _input: Input
  isLittleEndian: boolean | undefined

  /**
   * Set this type to big-endian encoding.
   */
  bigEndian(): this {
    this.isLittleEndian = false
    return this
  }

  /**
   * Decode a value from a DataView.
   * @param view The DataView to decode from.
   * @param target Target location.
   * @param target.byteOffset The offset from which to start decoding.
   */
  abstract decodeFrom(view: DataView, target: Target): Output

  /**
   * Encode a value into a DataView.
   * @param value The value to encode.
   * @param view The DataView to encode into.
   * @param byteOffset The offset from which to start encoding.
   * @returns The number of bytes written
   */
  abstract encodeInto(value: Input, view: DataView, byteOffset: number): number

  /**
   * Set this type to little-endian encoding.
   */
  littleEndian(): this {
    this.isLittleEndian = true
    return this
  }

  /**
   * The amount of padding necessary before writing this type at `byteOffset`.
   * @param byteOffset The offset from which encoding will start.
   */
  padding(_byteOffset: number): number { return 0 }

  /**
   * The size of the encoded value, in bytes.
   * @param value The value to encode.
   * @param byteOffset The offset from which encoding will start.
   */
  abstract sizeOf(value: Input, byteOffset: number): number
}

export abstract class CrunchesType<Output, Input = Output> extends CrunchesBase<Output, Input> {

  declare readonly $$nonOptional: true

  /**
   * Allocate a new DataView to fit the size of the encoded value.
   * @param value The value to encode.
   * @returns The DataView.
   */
  allocate(value: Input) {
    return new DataView(new ArrayBuffer(this.size(value)))
  }

  /**
   * Decode a value from a DataView.
   * @param view The DataView.
   * @returns The decoded value.
   */
  decode(view: DataView) {
    return this.decodeFrom(view, { byteOffset: 0 })
  }

  /**
   * Encode a value into a DataView.
   * @param value The value to encode.
   * @returns The DataView into which the value was encoded.
   */
  encode(value: Input) {
    const view = this.allocate(value)
    this.encodeInto(value, view, 0)
    return view
  }

  /**
   * Mark this codec as optional. Mainly used for object codec properties.
   */
  optional(): CrunchesOptional<this> {
    return new CrunchesOptional(this)
  }

  /**
   * Compute the size of an encoded value.
   * @param value The value whose size to compute.
   */
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

  bigEndian(): this {
    this.inner.isLittleEndian = false
    return this
  }

  decodeFrom(view: DataView, target: Target) {
    return this.inner.decodeFrom(view, target)
  }

  encodeInto(value: Inner['_input'] | undefined, view: DataView, byteOffset: number) {
    return this.inner.encodeInto(value, view, byteOffset)
  }

  littleEndian(): this {
    this.inner.isLittleEndian = true
    return this
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
