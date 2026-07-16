import { expect, test } from 'vitest'

import { string } from '#crunches'

test('string', () => {
  const codec = string()
  let value
  value = 'hello world'
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  value = ''
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('unicode', () => {
  const codec = string()
  const value = 'hαllo world'
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('varuint-prefixed string', () => {
  const codec = string({ varuint: true })
  const value = 'hello world'
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('prefix endianness', () => {
  // big
  expect(3).to.equal(string().bigEndian().encode('foo').getUint32(0, false))
  // default (little)
  expect(3).to.equal(string().encode('foo').getUint32(0, true))
  // little
  expect(3).to.equal(string().littleEndian().encode('foo').getUint32(0, true))
})
