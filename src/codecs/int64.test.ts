import { expect, test } from 'vitest'

import { int64 } from './int64.ts'

test('int64', async () => {
  const codec = int64()
  const value = -32n
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
