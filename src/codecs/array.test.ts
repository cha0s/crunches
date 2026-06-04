import { expect, test } from 'vitest'

import {
  array,
  CrunchesArray,
  float32,
  float64,
  int8,
  int16,
  int32,
  int64,
  object,
  string,
  uint8,
  uint16,
  uint32,
  uint64,
} from '#crunches'

for (const numberType of [
  int8,
  uint8,
  int16,
  uint16,
  int32,
  uint32,
  float32,
  float64,
]) {
  const element = numberType()
  const codec = array({
    element,
  })
  const fixedLengthCodec = array({
    element,
    length: 4,
  })
  const numbers = [1, 2, 3, 4]
  const testNumberArray = (codec: CrunchesArray<any>, value: Iterable<number>) => {
    expect(codec.decode(codec.encode(value))).to.deep.equal(
      new element.elementClass(value),
    )
  }
  test(`${numberType.name} typed array`, () => {
    testNumberArray(codec, new element.elementClass(numbers))
  })
  test(`${numberType.name} array`, () => {
    testNumberArray(codec, numbers)
  })
  test(`${numberType.name} iterable`, () => {
    testNumberArray(codec, new Set(numbers))
  })
  test(`${numberType.name} fixed-length typed array`, () => {
    testNumberArray(fixedLengthCodec, new element.elementClass(numbers))
  })
  test(`${numberType.name} fixed-length array`, () => {
    testNumberArray(fixedLengthCodec, numbers)
  })
  test(`${numberType.name} fixed-length iterable`, () => {
    testNumberArray(fixedLengthCodec, new Set(numbers))
  })
  test(`sparse ${numberType.name} array`, () => {
    const codec = array({
      element,
      sparse: true,
    })
    const value = [1, 2, , 4]
    const sparseValue = new element.elementClass([
      1,
      2,
      (numberType === float32) || (numberType === float64) ? NaN : 0,
      4,
    ])
    expect(codec.decode(codec.encode(value))).to.deep.equal(sparseValue)
  })
  test(`sparse ${numberType.name} fixed-length array`, () => {
    const value = [1, 2, , 4]
    const sparseValue = new element.elementClass([
      1,
      2,
      (numberType === float32) || (numberType === float64) ? NaN : 0,
      4,
    ])
    const fixedLengthCodec = array({
      element,
      length: 4,
      sparse: true,
    })
    expect(fixedLengthCodec.decode(fixedLengthCodec.encode(value))).to.deep.equal(sparseValue)
  })
}

for (const numberType of [
  int64,
  uint64,
]) {
  const element = numberType()
  const codec = array({
    element,
  })
  const testNumberArray = (value: Iterable<bigint>) => {
    expect(codec.decode(codec.encode(value))).to.deep.equal(
      new element.elementClass(value),
    )
  }
  test(`${numberType.name} typed array`, () => {
    testNumberArray(new element.elementClass([1n, 2n, 3n, 4n]))
  })
  test(`${numberType.name} array`, () => {
    testNumberArray([1n, 2n, 3n, 4n])
  })
  test(`${numberType.name} iterable`, () => {
    testNumberArray(new Set([1n, 2n, 3n, 4n]))
  })
  test(`sparse ${numberType.name} array`, () => {
    const codec = array({
      element,
      sparse: true,
    })
    const value = [1n, 2n, , 4n]
    expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  })
  test(`sparse ${numberType.name} fixed-length array`, () => {
    const value = [1n, 2n, , 4n]
    const fixedLengthCodec = array({
      element,
      length: 4,
      sparse: true,
    })
    expect(fixedLengthCodec.decode(fixedLengthCodec.encode(value))).to.deep.equal(value)
  })
}

test('string array', () => {
  const codec = array({
    element: string(),
  })
  const value = ['one', 'two', 'three', 'four']
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('fixed-length string array', () => {
  const codec = array({
    element: string(),
    length: 4,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('string iterable', () => {
  const codec = array({
    element: string(),
  })
  const value = ['one', 'two', 'three', 'four']
  expect(codec.decode(codec.encode(new Set(value)))).to.deep.equal(value)
})

test('fixed-length string iterable', () => {
  const codec = array({
    element: string(),
    length: 4,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(new Set(value))))).to.deep.equal(value)
})

test('sparse string array', () => {
  const codec = array({
    element: string(),
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('sparse fixed-length string array', () => {
  const codec = array({
    element: string(),
    length: 4,
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('sparse string iterable', () => {
  const codec = array({
    element: string(),
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(codec.decode(codec.encode(new Set(value)))).to.deep.equal(value)
})

test('sparse fixed-length string iterable', () => {
  const codec = array({
    element: string(),
    length: 4,
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(Array.from(codec.decode(codec.encode(new Set(value))))).to.deep.equal(value)
})

test('fixed-length string drop', () => {
  const length = 3
  const codec = array({
    element: string(),
    length,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value.slice(0, length))
})

test('fixed-length string starved', () => {
  const length = 3
  const codec = array({
    element: string(),
    length,
  })
  const value = ['one', 'two']
  expect(() => codec.size(value)).toThrow()
  expect(() => codec.encode(value)).toThrow()
})

for (const numberType of [
  int8,
  uint8,
  int16,
  uint16,
  int32,
  uint32,
  float32,
  float64,
]) {
  const element = numberType()
  test(`aligned ${numberType.name} array`, () => {
    const codec = object({
      offset: int8(),
      array: array({element}),
    })
    const value = {offset: 0, array: [0, 1, 2]}
    expect(Array.from(codec.decode(codec.encode(value)).array)).to.deep.equal(value.array)
  })
  test(`aligned fixed-length ${numberType.name} array`, () => {
    const codec = object({
      offset: int8(),
      array: array({element, length: 3}),
    })
    const value = {offset: 0, array: [0, 1, 2]}
    expect(Array.from(codec.decode(codec.encode(value)).array)).to.deep.equal(value.array)
  })
}

for (const numberType of [
  int64,
  uint64,
]) {
  const element = numberType()
  test(`aligned ${numberType.name} array`, () => {
    const codec = object({
      offset: int8(),
      array: array({element}),
    })
    const value = {offset: 0, array: [0n, 1n, 2n]}
    expect(Array.from(codec.decode(codec.encode(value)).array)).to.deep.equal(value.array)
  })
  test(`aligned fixed-length ${numberType.name} array`, () => {
    const codec = object({
      offset: int8(),
      array: array({element, length: 3}),
    })
    const value = {offset: 0, array: [0n, 1n, 2n]}
    expect(Array.from(codec.decode(codec.encode(value)).array)).to.deep.equal(value.array)
  })
}

test('prefix endianness', () => {
  // big
  expect(3).to.equal(array({element: uint32()}).bigEndian().encode([1, 2, 3]).getUint32(0, false))
  // default (little)
  expect(3).to.equal(array({element: uint32()}).encode([1, 2, 3]).getUint32(0, true))
  // little
  expect(3).to.equal(array({element: uint32()}).littleEndian().encode([1, 2, 3]).getUint32(0, true))
})

test('element endianness', () => {
  let encoded
  // big
  encoded = array({element: uint32(), length: 3}).bigEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, false))
  }
  // overridden (little)
  encoded = array({element: uint32().littleEndian(), length: 3}).bigEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, true))
  }
  // default (little)
  encoded = array({element: uint32(), length: 3}).encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, true))
  }
  // little
  encoded = array({element: uint32(), length: 3}).littleEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, true))
  }
  // overridden (big)
  encoded = array({element: uint32().bigEndian(), length: 3}).littleEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, false))
  }
})
