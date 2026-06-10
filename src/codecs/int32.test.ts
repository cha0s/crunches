import { expect, test } from 'vitest'

import { int32 } from '#crunches'

test('int32', () => {
  const codec = int32()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coercion', () => {
  const codec = int32()
  const value = 32.5
  expect(codec.decode(codec.encode(value))).to.deep.equal(32)
})
