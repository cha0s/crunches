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
  test(`${numberType.name} typed array`, async () => {
    testNumberArray(new element.elementClass([1, 2, 3, 4]))
  })
  test(`${numberType.name} array`, async () => {
    testNumberArray([1, 2, 3, 4])
  })
  test(`${numberType.name} iterable`, async () => {
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
  test(`${numberType.name} typed array`, async () => {
    testNumberArray(new element.elementClass([1n, 2n, 3n, 4n]))
  })
  test(`${numberType.name} array`, async () => {
    testNumberArray([1n, 2n, 3n, 4n])
  })
  test(`${numberType.name} iterable`, async () => {
    testNumberArray(new Set([1n, 2n, 3n, 4n]))
  })
}

test('string array', async () => {
  const codec = array({
    element: string(),
  })
  const value = ['one', 'two', 'three', 'four']
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('fixed-length integer array', async () => {
  const codec = array({
    element: uint8(),
    length: 4,
  })
  const value = [1, 2, 3, 4]
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('fixed-length float array', async () => {
  const codec = array({
    element: float64(),
    length: 4,
  })
  const value = [1, 2, 3, 4]
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('fixed-length string array', async () => {
  const codec = array({
    element: string(),
    length: 4,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('fixed-length string drop', async () => {
  const length = 3
  const codec = array({
    element: string(),
    length,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value.slice(0, length))
})

test('fixed-length string starved', async () => {
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
  test(`aligned ${numberType.name} array`, async () => {
    const codec = object({
      offset: int8(),
      array: array({element}),
    })
    const value = {offset: 0, array: [0, 1, 2]}
    expect(Array.from(codec.decode(codec.encode(value)).array)).to.deep.equal(value.array)
  })
  test(`aligned fixed-length ${numberType.name} array`, async () => {
    const codec = object({
      offset: int8(),
      array: array({element, length: 3}),
    })
    const value = {offset: 0, array: [0, 1, 2]}
    expect(Array.from(codec.decode(codec.encode(value)).array)).to.deep.equal(value.array)
  })
}
