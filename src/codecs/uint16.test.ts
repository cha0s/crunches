import { expect, test } from 'vitest'

import { uint16 } from '#crunches'

test('uint16', () => {
  const codec = uint16()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
