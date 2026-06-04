import { expect, test } from 'vitest'

import {
  boolean,
  type CrunchesBase,
  object,
  uint8,
  uint32,
} from '#crunches'

test('object', () => {
  const codec = object({
    1: uint8(),
    2: uint8(),
  })
  const value = {1: 32, 2: 32}
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('object boolean coalescence', () => {
  let codec
  const properties: Record<string, CrunchesBase<unknown, unknown>> = {}
  const value: Record<string, unknown> = {}
  for (let i = 0; i < 8; ++i) {
    properties[String(i)] = boolean()
    value[String(i)] = i
  }
  codec = object(properties)
  expect(codec.size(value)).to.equal(1)
  for (let i = 8; i < 16; ++i) {
    properties[String(i)] = boolean()
    value[String(i)] = i
  }
  codec = object(properties)
  expect(codec.size(value)).to.equal(2)
})

test('object optional coalescence', () => {
  let codec
  const properties: Record<string, CrunchesBase<unknown, unknown>> = {}
  const value: Record<string, unknown> = {}
  for (let i = 0; i < 8; ++i) {
    properties[i] = uint8().optional()
    value[i] = i
  }
  codec = object(properties)
  expect(codec.size(value)).to.equal(8 + 1)
  for (let i = 8; i < 16; ++i) {
    properties[i] = uint8().optional()
    value[i] = i
  }
  codec = object(properties)
  expect(codec.size(value)).to.equal(16 + 2)
})

test('object optional property', () => {
  const codec = object({
    1: uint8().optional(),
    2: uint8().optional(),
    3: object({
      4: uint8().optional(),
    }).optional(),
  })
  let value
  value = {1: 32, 2: 32, 3: {4: 32}}
  expect(codec.size(value)).to.equal(5)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  value = {1: 32, 2: 32, 3: {}}
  expect(codec.size(value)).to.equal(4)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  value = {1: 32, 2: 32}
  expect(codec.size(value)).to.equal(3)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  value = {1: 32}
  expect(codec.size(value)).to.equal(2)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  value = {}
  expect(codec.size(value)).to.equal(1)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('object boolean properties', () => {
  const properties: Record<string, CrunchesBase<unknown, unknown>> = {}
  const value: Record<string, unknown> = {}
  for (let i = 0; i < 8; ++i) {
    properties[i] = boolean()
    value[i] = !!(i % 2)
  }
  const codec = object(properties)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('object boolean optional interaction', () => {
  const properties: Record<string, CrunchesBase<unknown, unknown>> = {}
  const value: Record<string, unknown> = {}
  for (let i = 0; i < 8; ++i) {
    properties[i] = boolean().optional()
  }
  const codec = object(properties)
  expect(codec.size(value)).to.equal(1)
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('property endianness', () => {
  let encoded
  encoded = object({1: uint32(), 2: uint32()}).encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, true))
  expect(234).to.equal(encoded.getUint32(4, true))
  encoded = object({1: uint32(), 2: uint32()}).littleEndian().encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, true))
  expect(234).to.equal(encoded.getUint32(4, true))
  encoded = object({1: uint32().bigEndian(), 2: uint32()}).littleEndian().encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, false))
  expect(234).to.equal(encoded.getUint32(4, true))
  encoded = object({1: uint32(), 2: uint32().bigEndian()}).littleEndian().encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, true))
  expect(234).to.equal(encoded.getUint32(4, false))
  encoded = object({1: uint32(), 2: uint32()}).bigEndian().encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, false))
  expect(234).to.equal(encoded.getUint32(4, false))
  encoded = object({1: uint32().littleEndian(), 2: uint32()}).bigEndian().encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, true))
  expect(234).to.equal(encoded.getUint32(4, false))
  encoded = object({1: uint32(), 2: uint32().littleEndian()}).bigEndian().encode({1: 123, 2: 234})
  expect(123).to.equal(encoded.getUint32(0, false))
  expect(234).to.equal(encoded.getUint32(4, true))
})
