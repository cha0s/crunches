import { expect, test } from 'vitest'

import { uint8 } from '#crunches'

test('uint8', () => {
  const codec = uint8()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coercion', () => {
  const codec = uint8()
  const value = 32.5
  expect(codec.decode(codec.encode(value))).to.deep.equal(32)
})
