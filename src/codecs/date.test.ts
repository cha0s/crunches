import {expect, test} from 'vitest'

import { date } from './date.ts'

test('date', () => {
  const codec = date()
  const value = new Date('2024-11-24T18:58:48.912Z')
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.be.instanceOf(Date)
  expect(decoded).to.deep.equal(value)
})

test('coerce date number', () => {
  const codec = date()
  const value = 1234567
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.be.instanceOf(Date)
  expect(decoded).to.deep.equal(new Date(value))
})

test('coerce date string', () => {
  const codec = date()
  const value = '2024-11-24T18:58:48.912Z'
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.be.instanceOf(Date)
  expect(decoded).to.deep.equal(new Date(value))
})

test('prefix endianness', () => {
  // big
  expect(24).to.equal(date().bigEndian().encode(12345).getUint32(0, false))
  // default (little)
  expect(24).to.equal(date().encode(12345).getUint32(0, true))
  // little
  expect(24).to.equal(date().littleEndian().encode(12345).getUint32(0, true))
})
