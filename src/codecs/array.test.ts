import { expect, test } from 'vitest'

import { array } from './array.ts'
import { uint8 } from './uint8.ts'
import { int8 } from './int8.ts'
import { int16 } from './int16.ts'
import { uint16 } from './uint16.ts'
import { int32 } from './int32.ts'
import { uint32 } from './uint32.ts'
import { float32 } from './float32.ts'
import { float64 } from './float64.ts'
import { object } from './object.ts'
import { string } from './string.ts'
import { int64 } from './int64.ts'
import { uint64 } from './uint64.ts'

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
  const testNumberArray = (value: Iterable<number>) => {
    expect(codec.decode(codec.encode(value))).to.deep.equal(
      new element.elementClass(value),
    )
  }
  test(`${numberType.name} typed array`, () => {
    testNumberArray(new element.elementClass([1, 2, 3, 4]))
  })
  test(`${numberType.name} array`, () => {
    testNumberArray([1, 2, 3, 4])
  })
  test(`${numberType.name} iterable`, () => {
    testNumberArray(new Set([1, 2, 3, 4]))
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
}

test('string array', () => {
  const codec = array({
    element: string(),
  })
  const value = ['one', 'two', 'three', 'four']
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('fixed-length integer array', () => {
  const codec = array({
    element: uint8(),
    length: 4,
  })
  const value = [1, 2, 3, 4]
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('fixed-length float array', () => {
  const codec = array({
    element: float64(),
    length: 4,
  })
  const value = [1, 2, 3, 4]
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('fixed-length string array', () => {
  const codec = array({
    element: string(),
    length: 4,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
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
