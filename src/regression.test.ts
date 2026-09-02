/**
 * Regression tests for known bugs in crunches ≤ 3.3.4.
 *
 * Every test in this file FAILS against the current implementation and is
 * expected to PASS once the corresponding fix is applied. Groups are named
 * after the root cause, so a failing group points at the codec that needs
 * attention. Once the bugs are fixed, these tests double as regression
 * coverage and can stay.
 */
import { describe, expect, test } from 'vitest'

import {
  array,
  float64,
  json,
  map,
  object,
  Protocol,
  set,
  string,
  uint8,
  uint16,
  uint32,
} from '#crunches'
import { CrunchesOptional } from '#types'

// A codec and its `.optional()`-wrapped sibling must produce byte-identical
// output: `optional()` only adds an optionality layer and must not change the
// inner codec's on-the-wire encoding (including endianness propagation).
function encodeBytes(codec: unknown, value: unknown) {
  const inner = codec instanceof CrunchesOptional ? codec.inner : codec
  const view = (inner as { encode(value: unknown): DataView }).encode(value)
  return Array.from(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))
}

function decodeWith(codec: unknown, bytes: number[]) {
  const inner = codec instanceof CrunchesOptional ? codec.inner : codec
  return (inner as { decode(view: DataView): unknown }).decode(
    new DataView(new Uint8Array(bytes).buffer),
  )
}

describe('varuint-prefixed string sizing', () => {
  // `string({ varuint: true })` sizes its prefix with `value.length * 3`
  // (an over-estimate) but encodes the ACTUAL length, so the payload is
  // written at a different offset than the prefix implies, and decoding
  // reads a NUL byte (or worse) plus the shifted payload.
  // Broken for any length where sizeOf(3n) > sizeOf(n): 43..127, 5462..16383, ...
  for (const length of [43, 127, 6000]) {
    test(`roundtrips ${length} ascii chars`, () => {
      const codec = string({ varuint: true })
      const value = 'a'.repeat(length)
      expect(codec.decode(codec.encode(value))).to.equal(value)
    })
  }

  test('roundtrips a JSON payload longer than 42 bytes', () => {
    const codec = json({ varuint: true })
    const value = { a: 1, b: 'x'.repeat(50) }
    expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  })
})

describe('big-endian variable-length numeric arrays', () => {
  // The decode fast path creates a TypedArray over the raw buffer even when
  // the element codec is big-endian, reading the big-endian bytes as if
  // they were little-endian. The encoder correctly falls back to a
  // DataView loop, so only decoding is affected.
  test('uint32', () => {
    const codec = array({ element: uint32() }).bigEndian()
    const value = [1, 2, 3]
    expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
  })

  test('float64', () => {
    const codec = array({ element: float64() }).bigEndian()
    const value = [1.5, 2.5, 3.5]
    expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
  })

  test('sparse uint32', () => {
    const codec = array({ element: uint32(), sparse: true }).bigEndian()
    const value = [1, 2, 3]
    expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
  })

  test('as a protocol payload', () => {
    const protocol = new Protocol({ foo: array({ element: uint32() }).bigEndian() })
    const value = [1, 2, 3]
    const { payload } = protocol.decode(protocol.encode('foo', value))
    expect(Array.from(payload)).to.deep.equal(value)
  })
})

describe('one-shot iterables (generators)', () => {
  // encode()/size() iterate the input once to compute the size and a second
  // time to encode. A generator is exhausted by the first pass, so the
  // second pass sees an empty (or partially consumed) iterable.
  test('variable-length array', () => {
    const codec = array({ element: uint8() })
    function* gen() { yield 1; yield 2; yield 3 }
    expect(Array.from(codec.decode(codec.encode(gen())))).to.deep.equal([1, 2, 3])
  })

  test('fixed-length sparse array', () => {
    const codec = array({ element: string(), length: 3, sparse: true })
    function* gen() { yield 'a'; yield 'b'; yield 'c' }
    expect(Array.from(codec.decode(codec.encode(gen())))).to.deep.equal(['a', 'b', 'c'])
  })

  test('fixed-length sparse array with holes', () => {
    // The hole-scan pass (to decide dense vs sparse) consumes the
    // generator, then the sparse-encode pass reads `undefined` elements
    // and dereferences them -> TypeError.
    const codec = array({ element: string(), length: 3, sparse: true })
    function* gen() { yield 'a'; yield undefined; yield 'c' }
    expect(Array.from(codec.decode(codec.encode(gen())))).to.deep.equal(['a', undefined, 'c'])
  })

  test('map', () => {
    const codec = map({ key: uint8(), value: string() })
    function* gen(): Generator<[number, string]> { yield [1, 'one']; yield [2, 'two'] }
    expect(codec.decode(codec.encode(gen()))).to.deep.equal(new Map([[1, 'one'], [2, 'two']]))
  })

  test('set', () => {
    const codec = set({ element: string() })
    function* gen() { yield 'a'; yield 'b' }
    expect(codec.decode(codec.encode(gen()))).to.deep.equal(new Set(['a', 'b']))
  })
})

describe('misaligned DataViews', () => {
  // The typed-array fast path constructs
  // `new TypedArray(view.buffer, view.byteOffset + byteOffset, …)` which
  // throws a RangeError unless the ABSOLUTE offset is aligned to the
  // element width. padding() only aligns within the codec and cannot see
  // view.byteOffset, so codecs must fall back to DataView access (or
  // otherwise cope) when the absolute offset is misaligned.
  test('uint32 array at view offset 2', () => {
    const codec = array({ element: uint32() })
    const buffer = new ArrayBuffer(64)
    const view = new DataView(buffer, 2)
    const written = codec.encodeInto([1, 2, 3], view, 0)
    expect(written).to.equal(16)
    expect(Array.from(codec.decode(new DataView(buffer, 2)))).to.deep.equal([1, 2, 3])
  })

  test('uint16 array at view offset 1', () => {
    const codec = array({ element: uint16() })
    const buffer = new ArrayBuffer(64)
    const view = new DataView(buffer, 1)
    const written = codec.encodeInto([1, 2, 3], view, 0)
    expect(written).to.equal(10)
    expect(Array.from(codec.decode(new DataView(buffer, 1)))).to.deep.equal([1, 2, 3])
  })
})

describe('fixed-length numeric arrays', () => {
  // A fixed-length codec given fewer elements than its length silently
  // encodes the missing elements (as 0, or as stale bytes when reusing a
  // dirty buffer) instead of throwing — unlike the string codec, which the
  // existing 'fixed-length string starved' test pins as the expected
  // behavior.
  test('uint8 rejects short input', () => {
    const codec = array({ element: uint8(), length: 3 })
    expect(() => codec.encode([1, 2])).toThrow()
  })

  test('uint32 rejects short input', () => {
    const codec = array({ element: uint32(), length: 3 })
    expect(() => codec.encode([1, 2])).toThrow()
  })
})

describe('sparse maps with numeric values', () => {
  // A sparse map with an explicit `undefined` value decodes the value as 0:
  // the value array takes the dense typed-array path (hole scan is skipped
  // for plain arrays), silently coercing undefined to 0. Unlike the array
  // codec's documented hole behavior, nothing in the map docs says
  // undefined values are zeroed.
  test('preserves explicit undefined values', () => {
    const codec = map({ key: uint8(), value: uint8(), sparse: true })
    const value = new Map([[1, 10], [2, undefined], [3, 30]])
    expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  })
})

describe('protocol error reporting', () => {
  test('unknown id is named in the decode error', () => {
    const protocol = new Protocol({ foo: uint8() })
    expect(() => protocol.decode(new DataView(new Uint8Array([42]).buffer))).toThrow(/42/)
  })
})

describe('object keys', () => {
  // The generated decoder assigns `value["__proto__"] = …`, which sets the
  // object's prototype instead of creating an own property, silently
  // dropping the key.
  test('roundtrips a __proto__ property', () => {
    const codec = object({ ['__proto__']: uint8() })
    const value = { ['__proto__']: 7 }
    expect(codec.decode(codec.encode(value))['__proto__']).to.equal(7)
  })
})

describe('optional endianness propagation', () => {
  // `CrunchesOptional.bigEndian()`/`.littleEndian()` used to set the inner
  // codec's `isLittleEndian` directly instead of delegating to the inner
  // codec's own method. For composite codecs (array, string, map, set,
  // object) the method is what recursively propagates endianness to the
  // children that actually read/write multi-byte values (length prefixes,
  // element/key/value codecs). Skipping it left the children at the default
  // little-endian while the composite itself was marked big-endian, so the
  // same value encoded by a codec and by its `.optional()`-wrapped sibling
  // produced different wire bytes and neither side could decode the other's
  // output.
  function sameWireEncoding(
    makeBare: () => unknown,
    makeOptional: () => unknown,
    value: unknown,
    expected?: number[],
  ) {
    const bareBytes = encodeBytes(makeBare(), value)
    const optionalBytes = encodeBytes(makeOptional(), value)
    expect(optionalBytes).to.deep.equal(bareBytes)
    if (expected) {
      expect(optionalBytes).to.deep.equal(expected)
    }
    expect(decodeWith(makeBare(), optionalBytes)).to.deep.equal(value)
    expect(decodeWith(makeOptional(), optionalBytes)).to.deep.equal(value)
  }

  test('big-endian string', () => {
    // Big-endian string encodes its 32-bit length prefix big-endian; the
    // broken code left the prefix little-endian.
    sameWireEncoding(
      () => string().bigEndian(),
      () => string().optional().bigEndian(),
      'hi',
      [0, 0, 0, 2, 104, 105],
    )
  })

  test('big-endian uint32 array', () => {
    // Elements must be big-endian; the broken code left them little-endian.
    sameWireEncoding(
      () => array({ element: uint32() }).bigEndian(),
      () => array({ element: uint32() }).optional().bigEndian(),
      [1, 2, 3],
    )
  })

  test('big-endian uint16 array with fixed length', () => {
    sameWireEncoding(
      () => array({ element: uint16(), length: 2 }).bigEndian(),
      () => array({ element: uint16(), length: 2 }).optional().bigEndian(),
      [1, 2],
      [0, 1, 0, 2],
    )
  })

  test('big-endian sparse uint32 array', () => {
    sameWireEncoding(
      () => array({ element: uint32(), sparse: true }).bigEndian(),
      () => array({ element: uint32(), sparse: true }).optional().bigEndian(),
      [1, undefined, 3],
    )
  })

  test('big-endian map', () => {
    sameWireEncoding(
      () => map({ key: uint32(), value: uint32() }).bigEndian(),
      () => map({ key: uint32(), value: uint32() }).optional().bigEndian(),
      new Map([[1, 2]]),
    )
  })

  test('big-endian set', () => {
    sameWireEncoding(
      () => set({ element: uint32() }).bigEndian(),
      () => set({ element: uint32() }).optional().bigEndian(),
      new Set([1, 2]),
    )
  })

  test('big-endian object', () => {
    sameWireEncoding(
      () => object({ n: uint32(), s: string() }).bigEndian(),
      () => object({ n: uint32(), s: string() }).optional().bigEndian(),
      { n: 1, s: 'hi' },
    )
  })

  test('as a protocol payload', () => {
    // Protocol payloads are often declared optional on one side but not the
    // other; wire compatibility is the point.
    const bareCodec = array({ element: uint32() }).bigEndian()
    const optionalCodec = array({ element: uint32() }).optional().bigEndian()
    const bare = new Protocol({ m: bareCodec })
    // Protocol payload types are CrunchesType; the optional wrapper is not,
    // but it is the type-level equivalent of marking the property optional.
    const wrapped = new Protocol({ m: optionalCodec as unknown as typeof bareCodec })
    const value = [1, 2]
    const bareBytes = Array.from(new Uint8Array(bare.encode('m', value).buffer))
    const wrappedBytes = Array.from(new Uint8Array(wrapped.encode('m', value).buffer))
    expect(wrappedBytes).to.deep.equal(bareBytes)
    expect(bare.decode(new DataView(new Uint8Array(wrappedBytes).buffer))).to.deep.equal({ type: 'm', payload: value })
  })
})


