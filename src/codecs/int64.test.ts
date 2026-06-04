import { expect, test } from 'vitest'

import { int64 } from '#crunches'

test('int64', () => {
  const codec = int64()
  const value = -32n
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
