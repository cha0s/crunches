import { expect, test } from 'vitest'

import {
  set,
  uint8,
} from '#crunches'

test('set', () => {
  const codec = set({ element: uint8() })
  const value = new Set([1, 2, 3, 4])
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coerce set', () => {
  const codec = set({ element: uint8() })
  const value = [1, 2, 3, 4]
  expect(codec.decode(codec.encode(value))).to.deep.equal(new Set(value))
})

test('endianness', () => {
  const value = [1, 2, 3, 4]
  let encoded
  encoded = set({ element: uint8() }).encode(value)
  expect(4).to.equal(encoded.getUint32(0, true))
  encoded = set({ element: uint8() }).littleEndian().encode(value)
  expect(4).to.equal(encoded.getUint32(0, true))
  encoded = set({ element: uint8() }).bigEndian().encode(value)
  expect(4).to.equal(encoded.getUint32(0, false))
})
