import { expect, test } from 'vitest'

import { string, json } from '#crunches'

test('json', () => {
  const codec = json()
  const value = {
    this: 'is',
    1: {
      random: {
        bunch: [true, 'json', 'data']
      }
    }
  }
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.deep.equal(value)
})

test('json with replacer', () => {
  const codec = json({ replacer: ['foo'] })
  const value = { foo: 12, bar: 23, baz: 34 }
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.deep.equal({ foo: 12 })
})

test('json with space', () => {
  const codec = json({ space: 2 })
  const value = { foo: 12 }
  const stringified = string().decode(codec.encode(value))
  expect(stringified).to.equal(`{\n  "foo": 12\n}`)
})

test('json with reviver', () => {
  const codec = json({ reviver: (k: string, v: number) => 'bar' !== k ? v : v * 2 })
  const value = { foo: 12, bar: 24 }
  const decoded = codec.decode(codec.encode(value))
  expect(decoded).to.deep.equal({ foo: 12, bar: 48 })
})

test('json (arbitrary)', () => {
  const codec = json()
  class Something {
    x = 42.5
    y = 67
    toJSON() {
      return {
        x: Math.round(this.x),
        y: this.y,
      }
    }
  }
  const value = new Something()
  const decoded = codec.decode(codec.encode(value)) as any
  expect(decoded.x).to.deep.equal(Math.round(value.x))
})
