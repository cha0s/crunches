import { expect, test } from 'vitest'

import { boolean } from './boolean.ts'

test('bool', async () => {
  const codec = boolean()
  const value = true
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coerced bool', async () => {
  const codec = boolean()
  const value = 'truthy value'
  expect(codec.decode(codec.encode(value))).to.deep.equal(!!value)
})
