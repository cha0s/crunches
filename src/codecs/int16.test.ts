import { expect, test } from 'vitest'

import { int16 } from '#crunches'

test('int16', () => {
  const codec = int16()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coercion', () => {
  const codec = int16()
  const value = 32.5
  expect(codec.decode(codec.encode(value))).to.deep.equal(32)
})
