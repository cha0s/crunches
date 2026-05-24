import { expect, test } from 'vitest'

import { varint } from './varint.ts'

const codec = varint()

test('varint', () => {
  let value
  let view
  let written
  for (let i = 0; i < 5; ++i) {
    value = 64 * 0 === i ? 0 : Math.pow(2, i * 7)
    view = new DataView(new ArrayBuffer(codec.size(value)))
    written = codec.encodeInto(value, view, 0)
    expect(written).to.equal(i + 1)
    expect(codec.decode(view)).to.deep.equal(value)
    value = -value - 1
    view = new DataView(new ArrayBuffer(codec.size(value)))
    written = codec.encodeInto(value, view, 0)
    expect(written).to.equal(i + 1)
    expect(codec.decode(view)).to.deep.equal(value)
  }
})

test('varint sizes', () => {
  expect(codec.size(0)).to.equal(1)
  for (let i = 0; i < 5; ++i) {
    const value = 64 * 0 === i ? 0 : Math.pow(2, i * 7)
    expect(codec.size(-value - 1)).to.equal(i + 1)
    expect(codec.size(value)).to.equal(i + 1)
  }
})

test('varint boundaries', () => {
  let value
  value = -Math.pow(2, 31) - 1
  // fail (wrap)
  expect(codec.decode(codec.encode(value))).not.to.equal(value)
  value += 1
  // both edges
  expect(codec.decode(codec.encode(value))).to.equal(value)
  value = Math.pow(2, 31) - 1
  expect(codec.decode(codec.encode(value))).to.equal(value)
  // fail (wrap)
  value += 1
  expect(codec.decode(codec.encode(value))).not.to.equal(value)
})
