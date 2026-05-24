import { expect, test } from 'vitest'

import { uint8 } from './uint8.ts'

test('uint8', () => {
  const codec = uint8()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
