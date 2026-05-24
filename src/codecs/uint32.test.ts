import { expect, test } from 'vitest'

import { uint32 } from './uint32.ts'

test('uint32', async () => {
  const codec = uint32()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
