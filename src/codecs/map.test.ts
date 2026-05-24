import {expect, test} from 'vitest'

import { map } from './map.ts'
import { uint8 } from './uint8.ts'
import { string } from './string.ts'

test('map', async () => {
  const codec = map({
    key: uint8(),
    value: string(),
  })
  const value = new Map([[1, 'one'], [2, 'two']])
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('coerce map', async () => {
  const codec = map({
    key: uint8(),
    value: string(),
  })
  const value = [[1, 'one'], [2, 'two']]
  expect(codec.decode(codec.encode(value))).to.deep.equal(new Map(value as [number, string][]))
})
