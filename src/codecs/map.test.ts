import { expect, test } from 'vitest'

import {
  map,
  string,
  uint8,
  uint32,
} from '#crunches'

test('map', () => {
  const codec = map({ key: uint8(), value: string() })
  const value = new Map([[1, 'one'], [2, 'two']])
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coerce map', () => {
  const codec = map({ key: uint8(), value: string() })
  const value = [[1, 'one'], [2, 'two']] as Iterable<[number, string]>
  expect(codec.decode(codec.encode(value))).to.deep.equal(new Map(value as [number, string][]))
})

test('sparse map', () => {
  const codec = map({ key: uint8(), value: string(), sparse: true })
  const value = [[1, 'one'], [2, undefined], [3, 'bar']] as Iterable<[number, string]>
  expect(codec.decode(codec.encode(value))).to.deep.equal(new Map(value as [number, string][]))
})

test('prefix endianness', () => {
  const value = [[1, 'one'], [2, 'two']] as Iterable<[number, string]>
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
  const value = [[1, 'one'], [2, 'two']] as Iterable<[number, string]>
  let encoded
  // little
  encoded = map({ key: uint32().littleEndian(), value: string() }).encode(value)
  expect(1).to.equal(encoded.getUint32(4, true))
  expect(2).to.equal(encoded.getUint32(8, true))
  // default (little)
  encoded = map({ key: uint32(), value: string() }).encode(value)
  expect(1).to.equal(encoded.getUint32(4, true))
  expect(2).to.equal(encoded.getUint32(8, true))
  // big
  encoded = map({ key: uint32().bigEndian(), value: string() }).encode(value)
  expect(1).to.equal(encoded.getUint32(4, false))
  expect(2).to.equal(encoded.getUint32(8, false))
  encoded = map({ key: uint32(), value: string() }).bigEndian().encode(value)
  expect(1).to.equal(encoded.getUint32(4, false))
  expect(2).to.equal(encoded.getUint32(8, false))
  // overridden (little)
  encoded = map({ key: uint32().littleEndian(), value: string() }).bigEndian().encode(value)
  expect(1).to.equal(encoded.getUint32(4, true))
  expect(2).to.equal(encoded.getUint32(8, true))
})

test('value endianness', () => {
  const value = [[1, 'one'], [2, 'two']] as Iterable<[number, string]>
  let encoded
  // little
  encoded = map({ key: uint32(), value: string().littleEndian() }).encode(value)
  expect(3).to.equal(encoded.getUint32(12, true))
  // default (little)
  encoded = map({ key: uint32(), value: string() }).encode(value)
  expect(3).to.equal(encoded.getUint32(12, true))
  // big
  encoded = map({ key: uint32(), value: string().bigEndian() }).encode(value)
  expect(3).to.equal(encoded.getUint32(12, false))
  encoded = map({ key: uint32(), value: string() }).bigEndian().encode(value)
  expect(3).to.equal(encoded.getUint32(12, false))
  // overridden (little)
  encoded = map({ key: uint32(), value: string().littleEndian() }).bigEndian().encode(value)
  expect(3).to.equal(encoded.getUint32(12, true))
})
