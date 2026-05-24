import {expect, test} from 'vitest'

import { map } from './map.ts'
import { uint8 } from './uint8.ts'
import { uint32 } from './uint32.ts'
import { string } from './string.ts'

test('map', () => {
  const codec = map({ key: uint8(), value: string() })
  const value = new Map([[1, 'one'], [2, 'two']])
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coerce map', () => {
  const codec = map({ key: uint8(), value: string() })
  const value = [[1, 'one'], [2, 'two']]
  expect(codec.decode(codec.encode(value))).to.deep.equal(new Map(value as [number, string][]))
})

test('prefix endianness', () => {
  const value = [[1, 'one'], [2, 'two']]
  let encoded
  // big
  encoded = map({ key: uint8(), value: string() }).bigEndian().encode(value)
  expect(2).to.equal(encoded.getUint32(0, false))
  // default (little)
  encoded = map({ key: uint8(), value: string() }).encode(value)
  expect(2).to.equal(encoded.getUint32(0, true))
  // big
  encoded = map({ key: uint8(), value: string() }).littleEndian().encode(value)
  expect(2).to.equal(encoded.getUint32(0, true))
})

test('key endianness', () => {
  const value = [[1, 'one'], [2, 'two']]
  let encoded
  // little
  encoded = map({ key: uint32().littleEndian(), value: string() }).encode(value)
  expect(1).to.equal(encoded.getUint32(4, true))
  expect(2).to.equal(encoded.getUint32(15, true))
  // default (little)
  encoded = map({ key: uint32(), value: string() }).encode(value)
  expect(1).to.equal(encoded.getUint32(4, true))
  expect(2).to.equal(encoded.getUint32(15, true))
  // big
  encoded = map({ key: uint32().bigEndian(), value: string() }).encode(value)
  expect(1).to.equal(encoded.getUint32(4, false))
  expect(2).to.equal(encoded.getUint32(15, false))
  encoded = map({ key: uint32(), value: string() }).bigEndian().encode(value)
  expect(1).to.equal(encoded.getUint32(4, false))
  expect(2).to.equal(encoded.getUint32(15, false))
  // overridden (little)
  encoded = map({ key: uint32().littleEndian(), value: string() }).bigEndian().encode(value)
  expect(1).to.equal(encoded.getUint32(4, true))
  expect(2).to.equal(encoded.getUint32(15, true))
})

test('value endianness', () => {
  const value = [[1, 'one'], [2, 'two']]
  let encoded
  // little
  encoded = map({ key: uint32(), value: string().littleEndian() }).encode(value)
  expect(3).to.equal(encoded.getUint32(8, true))
  // default (little)
  encoded = map({ key: uint32(), value: string() }).encode(value)
  expect(3).to.equal(encoded.getUint32(8, true))
  // big
  encoded = map({ key: uint32(), value: string().bigEndian() }).encode(value)
  expect(3).to.equal(encoded.getUint32(8, false))
  encoded = map({ key: uint32(), value: string() }).bigEndian().encode(value)
  expect(3).to.equal(encoded.getUint32(8, false))
  // overridden (little)
  encoded = map({ key: uint32(), value: string().littleEndian() }).bigEndian().encode(value)
  expect(3).to.equal(encoded.getUint32(8, true))
})
