import { expect, test } from 'vitest'

import { float32 } from './float32.ts'

test('float32', async () => {
  const codec = float32()
  const value = 1 / 4
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('float32 infinity', async () => {
  const codec = float32()
  const value = Infinity
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
