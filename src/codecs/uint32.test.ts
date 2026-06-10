import { expect, test } from 'vitest'

import { uint32 } from '#crunches'

test('uint32', () => {
  const codec = uint32()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coercion', () => {
  const codec = uint32()
  const value = 32.5
  expect(codec.decode(codec.encode(value))).to.deep.equal(32)
})
