import { Buffer } from 'node:buffer'
import SchemaPack from 'schemapack'
import { array, buffer, float32, object, string, uint8, varuint } from '../src/index.ts'

const codec = object({
  name:    string({ varuint: true }),
  age:     uint8(),
  weight:  float32(),
  likes:   array({ element: uint8() }),
  varints: array({ element: varuint() }),
  opaque:  buffer({ varuint: true }),
})

const specification = {
  name: 'string',
  age: 'uint8',
  weight: 'float32',
  likes: ['uint8'],
  varints: ['varuint'],
  opaque: 'buffer',
}

const ARRAY_LENGTH = 1024

const opaque = Buffer.alloc(ARRAY_LENGTH)

const value = {
  name: 'John Smith',
  age: 32,
  weight: 188.5,
  likes: Array(ARRAY_LENGTH).fill(0),
  varints: Array(ARRAY_LENGTH).fill(0).map(() => Math.floor(Math.random() * Math.pow(2, 31))),
  opaque: opaque.buffer,
}

const N = 10000

const schemaPackPerson = SchemaPack.build(specification)
const schemaPackValue = { ...value, opaque }
const schemaPackBuffer = schemaPackPerson.encode(schemaPackValue)
const crunchesView = codec.allocate(value)

console.group('encoding x', N)

// warmup
for (let i = 0; i < N; ++i) schemaPackPerson.encode(schemaPackValue)
for (let i = 0; i < N; ++i) codec.encodeInto(value, crunchesView, 0)
for (let i = 0; i < N; ++i) codec.encode(value)

let start = performance.now()
for (let i = 0; i < N; ++i) schemaPackPerson.encode(schemaPackValue)
console.log('SchemaPack\t', (performance.now() - start).toFixed(2), 'ms')

start = performance.now()
for (let i = 0; i < N; ++i) codec.encodeInto(value, crunchesView, 0)
console.log('crunches (encodeInto)\t', (performance.now() - start).toFixed(2), 'ms')

start = performance.now()
for (let i = 0; i < N; ++i) codec.encode(value)
console.log('crunches (encode)\t', (performance.now() - start).toFixed(2), 'ms')

console.groupEnd()

console.group('decoding x', N)

// warmup
for (let i = 0; i < N; ++i) schemaPackPerson.decode(schemaPackBuffer)
for (let i = 0; i < N; ++i) codec.decode(crunchesView)

start = performance.now()
for (let i = 0; i < N; ++i) schemaPackPerson.decode(schemaPackBuffer)
console.log('SchemaPack\t', (performance.now() - start).toFixed(2), 'ms')

start = performance.now()
for (let i = 0; i < N; ++i) codec.decode(crunchesView)
console.log('crunches\t', (performance.now() - start).toFixed(2), 'ms')

console.groupEnd()
