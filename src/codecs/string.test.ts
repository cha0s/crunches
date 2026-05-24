import { expect, test } from 'vitest'

import { string } from './string.ts'

test('string', async () => {
  const codec = string()
  let value
  value = 'hello world'
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  value = ''
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('unicode', async () => {
  const codec = string()
  const value = 'hαllo world'
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('varuint-prefixed string', async () => {
  const codec = string({varuint: true})
  const value = 'hello world'
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})
