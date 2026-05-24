import { expect, test } from 'vitest'

import { set } from './set.ts'
import { uint8 } from './uint8.ts'

test('set', async () => {
  const codec = set({
    element: uint8(),
  })
  const value = new Set([1, 2, 3, 4])
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coerce set', async () => {
  const codec = set({
    element: uint8(),
  })
  const value = [1, 2, 3, 4]
  expect(codec.decode(codec.encode(value))).to.deep.equal(new Set(value))
})
