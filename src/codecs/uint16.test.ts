import { expect, test } from 'vitest'

import { uint16 } from './uint16.ts'

test('uint16', async () => {
  const codec = uint16()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
