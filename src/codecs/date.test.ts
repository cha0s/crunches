import {expect, test} from 'vitest'

import { date } from './date.ts'

test('date', async () => {
  const codec = date()
  const value = new Date('2024-11-24T18:58:48.912Z')
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.be.instanceOf(Date)
  expect(decoded).to.deep.equal(value)
})

test('coerce date number', async () => {
  const codec = date()
  const value = 1234567
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.be.instanceOf(Date)
  expect(decoded).to.deep.equal(new Date(value))
})

test('coerce date string', async () => {
  const codec = date()
  const value = '2024-11-24T18:58:48.912Z'
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.be.instanceOf(Date)
  expect(decoded).to.deep.equal(new Date(value))
})
