import { expect, test } from 'vitest'

import { int32 } from './int32.ts'

test('int32', () => {
  const codec = int32()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
