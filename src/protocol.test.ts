import { expect, test } from 'vitest'

import {
  array,
  CrunchesType,
  float32,
  float64,
  int8,
  int16,
  int32,
  int64,
  object,
  Protocol,
  string,
  uint8,
  uint16,
  uint32,
  uint64,
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

function testAllAlignments(element: CrunchesType<any>, value: any, length = 0) {
  for (let i = 0; i < 8; ++i) {
    const spec: Record<string, CrunchesType<any>> = {}
    for (let j = 0; j < i; ++j) {
      spec[`o${j}`] = int8()
    }
    spec.array = array({ element, length })
    const codec = object(spec)
    const protocol = new Protocol({
      foo: codec,
    })
    const result: any = {}
    for (let j = 0; j < i; ++j) {
      result[`o${j}`] = j
    }
    result.array = value
    expect(Array.from(protocol.decode(protocol.encode('foo', result)).payload.array)).to.deep.equal(Array.from(result.array))
  }
}

test('alignment', () => {
  for (const numberType of [
    int8,
    uint8,
    int16,
    uint16,
    int32,
    uint32,
    float32,
    float64,
  ]) {
    testAllAlignments(numberType(), [0, 1, 2])
  }
  for (const numberType of [
    int64,
    uint64,
  ]) {
    testAllAlignments(numberType(), [0n, 1n, 2n])
  }
})
