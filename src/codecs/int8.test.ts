import { expect, test } from 'vitest'

import { int8 } from '#crunches'

test('int8', () => {
  const codec = int8()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coercion', () => {
  const codec = int8()
  const value = 32.5
  expect(codec.decode(codec.encode(value))).to.deep.equal(32)
})
