import { expect, test } from 'vitest'

import { float64 } from './float64.ts'

test('float64', () => {
  const codec = float64()
  const value = 1 / 7
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('float64 infinity', () => {
  const codec = float64()
  const value = Infinity
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
