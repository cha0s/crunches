import { expect, test } from 'vitest'

import { int16 } from './int16.ts'

test('int16', () => {
  const codec = int16()
  const value = 32
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
