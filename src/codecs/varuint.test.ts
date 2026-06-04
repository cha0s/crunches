import { expect, test } from 'vitest'

import { varuint } from '#crunches'

const codec = varuint()

test('varuint', () => {
  for (let i = 0; i < 5; ++i) {
    const value = 128 * 0 === i ? 0 : Math.pow(2, i * 7)
    expect(codec.decode(codec.encode(value))).to.equal(value)
  }
})

test('varuint sizes', () => {
  expect(codec.size(0)).to.equal(1)
  for (let i = 0; i < 5; ++i) {
    expect(codec.size(128 * 0 === i ? 0 : Math.pow(2, i * 7))).to.equal(i + 1)
  }
})

test('varuint boundaries', () => {
  let value
  // crash
  value = -1
  expect(() => codec.decode(codec.encode(value!))).toThrow()
  // both edges
  value = 0
  expect(codec.decode(codec.encode(value))).to.equal(value)
  value = Math.pow(2, 32) - 1
  expect(codec.decode(codec.encode(value))).to.equal(value)
  // fail (wrap)
  value += 1
  expect(codec.decode(codec.encode(value))).not.to.equal(value)
})

