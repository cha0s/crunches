import { expect, test } from 'vitest'

import { uint64 } from './uint64.ts'

test('uint64', () => {
  const codec = uint64()
  const value = 32n
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
