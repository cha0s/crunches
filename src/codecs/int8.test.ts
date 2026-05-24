import { expect, test } from 'vitest'

import { int8 } from './int8.ts'

test('int8', async () => {
  const codec = int8()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
