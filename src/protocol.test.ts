import { expect, test } from 'vitest'

import {
  object,
  Protocol,
  string,
  uint8,
} from '#crunches'

const protocol = new Protocol({
  foo: object({
    bar: uint8(),
  }),
  food: string(),
})

test('decode / encode', () => {
  expect(protocol.decode(protocol.encode('food', 'hello'))).to.deep.equal({
    type: 'food',
    payload: 'hello',
  })
  expect(protocol.decode(protocol.encode('foo', { bar: 42 }))).to.deep.equal({
    type: 'foo',
    payload: { bar: 42 },
  })
})

test('decodeFrom / encodeInto', () => {
  //           id + prefix + string('yummy') + id + ubyte(67)
  const size = 1  + 4      + 5               + 1  + 1
  const view = new DataView(new ArrayBuffer(size))
  let written = 0
  written += protocol.encodeInto('food', 'yummy', view, written)
  written += protocol.encodeInto('foo', {bar: 67}, view, written)
  const results = []
  const target = { byteOffset: 0 }
  results.push(protocol.decodeFrom(view, target))
  results.push(protocol.decodeFrom(view, target))
  expect(results).to.deep.equal([
    {
      type: 'food',
      payload: 'yummy',
    },
    {
      type: 'foo',
      payload: { bar: 67 },
    },
  ])
  expect(written).to.equal(size)
})
