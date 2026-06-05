![CI](https://github.com/cha0s/crunches/actions/workflows/ci.yml/badge.svg)

# crunches :muscle: 

The smallest **and** fastest TypeScript web standards-compliant value serialization library in the wild. **4.09 KiB** gzipped; **0 dependencies**. Strongly-typed and still works fine in plain JS. Efficiently encode and decode your values to and from `ArrayBuffer`s. Integrates very well with WebSockets.

## Example

```ts
import { array, boolean, float32, object, uint8, varuint } from 'crunches'

const playerSchema = object({
  position: array({
    element: float32(),
    length: 3,
  }),
  health: varuint(),
  jumping: boolean(),
  attributes: object({
    str: uint8(),
    agi: uint8(),
    int: uint8(),
  }),
})
```

On the server:
```js
const player = {
  position: [-540.2378623, 343.183749, 1201.23897468],
  health: 4000,
  jumping: false,
  attributes: {str: 87, agi: 42, int: 22},
}

// encode the value to a new `DataView`
const view = playerSchema.encode(player)
// use some socket library to send the binary data...
socket.emit('player-data', view)
```

On the client:
```js
// use some socket library to receive the binary data...
socket.on('player-data', (buffer) => {
  const player = playerSchema.decode(buffer)
})
```

In this example, the size of payload is only **18 bytes**. `JSON.stringify` would consume **124 bytes**.

### Allocating a buffer and view

There is a convenience method which will allocate a view over a buffer sized to hold your value.

```js
// create a view for our value
const view = playerSchema.allocate(player)
// pass the view to the encoder
playerSchema.encodeInto(player, view, 0)
```

It can be useful for performance reasons to reuse your buffers.

This is sugar over the following:

```js
// get the schema size
const size = playerSchema.size(player)
// allocate a buffer
const buffer = new ArrayBuffer(size)
// create a view over the buffer
const view = new DataView(buffer)
// pass the view to the encoder
playerSchema.encodeInto(player, view, 0)
```

You may `encodeInto` a view over any existing `ArrayBuffer` **provided that it's large enough to contain the encoded payload**.

## Primitive types

| Type Name             | Bytes                                                                                                                                                                                                                                                                                                                                       | Range of Values                                                                                                                                                                                                |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| boolean | 1 (worst case, see [boolean coalescence](#boolean-coalescence))                                                                                                                                                                                                                                                                             | Truthy values are coerced to `true`; falsy values to `false`                                                                                                                                                   |
| int8                  | 1                                                                                                                                                                                                                                                                                                                                           | -128 to 127                                                                                                                                                                                                    |
| uint8                 | 1                                                                                                                                                                                                                                                                                                                                           | 0 to 255                                                                                                                                                                                                       |
| int16                 | 2                                                                                                                                                                                                                                                                                                                                           | -32,768 to 32,767                                                                                                                                                                                              |
| uint16                | 2                                                                                                                                                                                                                                                                                                                                           | 0 to 65,535                                                                                                                                                                                                    |
| int32                 | 4                                                                                                                                                                                                                                                                                                                                           | -2,147,483,648 to 2,147,483,647                                                                                                                                                                                |
| uint32                | 4                                                                                                                                                                                                                                                                                                                                           | 0 to 4,294,967,295                                                                                                                                                                                             |
| int64                 | 8                                                                                                                                                                                                                                                                                                                                           | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807<br /><br />**NOTE:** Only accepts and decodes to [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)s. |
| uint64                | 8                                                                                                                                                                                                                                                                                                                                           | 0 to 18,446,744,073,709,551,615<br /><br />**NOTE:** Only accepts and decodes to [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)s.                         |
| float32               | 4                                                                                                                                                                                                                                                                                                                                           | 3.4E +/- 38 (7 digits)                                                                                                                                                                                         |
| float64               | 8                                                                                                                                                                                                                                                                                                                                           | 1.7E +/- 308 (15 digits)                                                                                                                                                                                       |
| string                | [Prefix](#varuint-prefixes) followed by the [encoded](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto) string bytes                                                                                                                                                                                                 | Any string                                                                                                                                                                                                     |
| buffer                | [Prefix](#varuint-prefixes) followed by the bytes of the buffer                                                                                                                                                                                                                                                                             | Any `ArrayBuffer`<br /><br />**NOTE:** Decodes to a `DataView`.<br /><br />See: [buffers and arrays](#buffers-and-arrays).                                                                                     |
| varuint               | <table><tr><th>size</th><th>min</th><th>max</th></tr><tr><td>1</td><td>0</td><td>127</td></tr><tr><td>2</td><td>128</td><td>16,383</td></tr><tr><td>3</td><td>16,384</td><td>2,097,151</td></tr><tr><td>4</td><td>2,097,152</td><td>268,435,455</td></tr><tr><td>5</td><td>268,435,456</td><td>4,294,967,295</td></tr></table>              | 0 to 4,294,967,295                                                                                                                                                                                             |
| varint                | <table><tr><th>size</th><th>min</th><th>max</th></tr><tr><td>1</td><td>-64</td><td>63</td></tr><tr><td>2</td><td>-8,192</td><td>8,191</td></tr><tr><td>3</td><td>-1,048,576</td><td>1,048,575</td></tr><tr><td>4</td><td>-134,217,728</td><td>134,217,727</td></tr><tr><td>5</td><td>-2,147,483,648</td><td>2,147,483,647</td></tr></table> | -2,147,483,648 to 2,147,483,647                                                                                                                                                                                |
| date                  | Same as `string` above after calling [`toIsoString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)                                                                                                                                                                                     | Value is coerced to `Date` e.g. `new Date(value).toIsoString()`                                                                                                                                                |

## Aggregate types

### `object`

Requires a properties object. Supports [`optional` fields](#optional-fields). Booleans are [coalesced](#boolean-coalescence).

Example:

```ts
const schema = object({
  foo: uint32(),
  bar: string().optional(),
})
// 14 =
//   uint32        (4) +
//   optional flag (1) +
//   string prefix (4) +
//   'hello'       (5)
expect(schema.size({foo: 32, bar: 'hello'})).to.equal(14)
// 5 =
//   uint32        (4) +
//   optional flag (1)
expect(schema.size({foo: 32})).to.equal(5)
```

### `array`

Requires an `element` key to define the structure of the array elements. Encodes a 32-bit prefix followed by the contents of the array.

```ts
const schema = array({
  element: uint32(),
})
// 16 =
//   array prefix (4) +
//   uint32       (4) +
//   uint32       (4) +
//   uint32       (4)
expect(schema.size([1, 2, 3])).to.equal(16)
```

Arrays of number types decode to [the corresponding `TypedArray`](#buffers-and-arrays).

#### Fixed-length arrays

Arrays may be encoded as fixed-length through the `length` key.

```ts
const schema = array({
  element: uint32(),
  length: 3,
})
// 12 =
//   uint32 (4) +
//   uint32 (4) +
//   uint32 (4)
expect(schema.size([1, 2, 3])).to.equal(12)
```

No prefix is written, saving 4 bytes!

#### Sparse arrays

Arrays may be encoded as sparse through the `sparse` key.

```ts
const schema = array({
  element: string(),
  sparse: true,
})
```

As the name implies, this allows sparse arrays such as:

```ts
// 24 =
//   array prefix    (4) +
//   sparse flag     (1) +
//   presence length (4) +
//   3 presence bits (1) +
//   string length   (4) +
//   'foo'           (3) +
//   string length   (4) +
//   'bar'           (3)
expect(schema.size(['foo', , 'bar'])).to.equal(24)
```

A coalesced bitmap is encoded after the 32-bit prefix and before the values, similarly to how [booleans are coalesced](#boolean-coalescence). That's why the example above only uses 1 byte to encode the presence of 3 elements.

A couple notes about sparse arrays:

- A 1-byte flag is added after the length prefix (or at the beginning for a fixed-length array). The array will be tested for holes before encoding and if it doesn't contain holes, a faster path will be taken.

- For performance, little-endian numeric types (except `int64` and `uint64`) that are passed an actual `Array` or `TypedArray` will not encode holes. The integer types will replace holes with `0` and the float types will replace holes with `NaN`.

  If you want these types to actually encode holes, you must encode a non-`Array | TypedArray` iterator which will incur a performance penalty.

- sparse `int64` and `uint64` arrays will always incur a performance penalty, since their `TypedArray` constructors will throw when trying to coerce an array with holes.

  (This actually seems like it might be a bug in the standard. :))

### `map`

Requires a `key` and `value` key to define the structure of the map. Any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) will be coerced as [entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map#iterable). Encoded as an array of entries. Decodes to a native `Map` object.

```ts
const schema = map({
  key: int32(),
  value: string(),
})
const value = new Map<number, string>()
value.set(32, 'sup')
value.set(64, 'hi')
// 25 =
//   array prefix  (4) +
//   int32         (4) +
//   string prefix (4) +
//   'sup'         (3) +
//   int32         (4) +
//   string prefix (4) +
//   'hi'          (2)
expect(schema.size(value)).to.equal(25)
// same, with coercion
expect(schema.size([[32, 'sup'], [64, 'hi']])).to.equal(25)
```

#### Sparse maps

Maps may be encoded as sparse through the `sparse` key.

```ts
const schema = map({
  key: uint8(),
  value: string(),
  sparse: true,
})
```

As the name implies, this allows sparse maps such as:

```ts
// 27 =
//   array prefix    (4) +
//   uint8 key       (1) +
//   uint8 key       (1) +
//   uint8 key       (1) +
//   sparse flag     (1) +
//   presence length (4) +
//   3 presence bits (1) +
//   string length   (4) +
//   'one'           (3) +
//   string length   (4) +
//   'bar'           (3)
const entries = [[1, 'one'], [2, undefined], [3, 'bar']] as Iterable<[number, string]>
expect(schema.size(entries)).to.equal(27)
```

### `set`

Requires an `element` key to define the structure of the map. Any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) will be coerced. Encoded as an array. Decodes to a native `Set` object.

```ts
const schema = set({
  element: string(),
})
const value = new Set<string>()
value.add('foo')
value.add('bar')
// 18 =
//   array prefix  (4) +
//   string prefix (4) +
//   'foo'         (3) +
//   string prefix (4) +
//   'bar'         (3)
expect(schema.size(value)).to.equal(18)
// same, with coercion
expect(schema.size(['foo', 'bar'])).to.equal(18)
```

## :fire: features

### Protocols

So, you've implemented a couple of packet schemas like:

```ts
const heartbeat = uint8()

const message = object({
  body: string(),
  from: string().optional(),
  channel: string(),
})
```

and now you want to be able to send either schema over a WebSocket to clients. You might think, "I'll add a `varuint` ID for each packet and send it before each packet type so that the client knows which schema to decode".

That's such a common pattern that `crunches` provides a helper for this: `Protocol`!

We could write the above packet schemas like so:

```ts

import { object, Protocol, string, uint32 } from 'crunches'

const protocol = new Protocol({
  heartbeat: uint32(),
  message: object({
    body: string(),
    from: string().optional(),
  }),
})
```

(and probably a lot more)...

Now, you can write on the client:

```ts
import { type ProtocolInfer } from 'crunches'

let lastReceivedHeartbeat: number = 0
const messages: ProtocolInfer<typeof protocol, 'message'>[] = []; // infer message payload type

socket.addEventListener('message', (event: MessageEvent) => {
  const { type, payload } = protocol.decode(new DataView(event.data));
  switch (type) {
    case 'heartbeat': {
      lastReceivedHeartbeat = payload
      break
    }
    case 'message': {
      messages.push(payload)
      break
    }
  }
})
```

and then on the server:

```ts
socket.send(protocol.encode('heartbeat', 1234))
socket.send(protocol.encode('message', {
  body: 'Hello!',
  from: 'admin',
}))
```

No messing with packet IDs or anything, `crunches` handles it all for you!

Under the hood, `crunches` encodes the packet ID as `varuint`, so the overhead will only be 1 byte until you have more than 127 packet types. Not bad!

### Boolean coalescence

Any code monkey worth their salt secretly wonders whether their `boolean` type actually takes a single bit of space. The `crunches` answer is: **ideally, yes!**

The reason it's not an unequivocal "yes" is because there is no actual bit-width primitive when dealing with `DataView`s in JavaScript. **However**, boolean fields are packed as much as possible.

In other words, if you have an object with 2 boolean fields, the object itself will encode to **1 byte**! This is the case all the way up to 8 boolean fields. If you add another, the object encodes to **2 bytes**, up until you have more than 16 boolean fields!

More concretely, packing boolean fields takes

```js
Math.ceil(numberOfBooleanFields / 8)
```

bytes of space.

### Optional fields

Object properties may call an `optional` method. If the value is `undefined` upon encoding, the field will be encoded as not present. Upon decoding, the presence flag is checked and if the value is not present, the value decoding will be skipped and `undefined` will be returned as the decoded value.

This is a great alternative for rolling updates to a monolithic state, which would otherwise have to be individually defined for every discrete slice of state that could update.

Using the original example with optional fields:

```ts
const stateSchema = object({
  position: array({
    element: float32(),
    length: 3,
  }).optional(),
  health: varuint().optional(),
  jumping: boolean().optional(),
  attributes: object({
    str: uint8(),
    agi: uint8(),
    int: uint8(),
  }).optional(),
})
```

if we were to check the size of a completely blank update:

```js
expect(stateSchema.size({})).to.equal(1)
```

We will see that the size is **1 byte**! It literally doesn't get better than that. How is it only one byte when we have 4 optional fields? Well,

### Optional field coalescence

The same packing as for [booleans](#boolean-coalescence) occurs when encoding the presence of optional fields on an object. Each optional field ideally takes a single bit to encode its presence value. In other words, if you have an object with up to 8 optional fields, the presence encoding only takes **1 byte**!

More concretely, packing optional flags takes

```js
Math.ceil(numberOfOptionalFields / 8)
```

bytes of space.

### Endianness

`crunches` defaults to little-endian byte ordering to align with the majority of architectures'
implementation of `TypedArray`. This may be overridden on any crunches type:

```ts
const stateSchema = object({
  health: varuint(), // by default, properties inherit the endianness of their parent
  strength: varuint(), // so, these properties are big endian
  accumulator: uint32().littleEndian(), // but children may override their endianness
}).bigEndian(); // the object is big endian
```

### Extensible

You may define your own codecs:

```ts
import { CrunchesString, CrunchesType, object, string, Target } from 'crunches'

type CoercibleToDate = Date | string | number

export class MySuperCustomDate

  // extend CrunchesType<OUTPUT_TYPE, INPUT_TYPE> to create your codec!
  //
  // this means our codec outputs `Date`s and accepts `Date`s, `string`s and `number`s.
  extends CrunchesType<Date, CoercibleToDate>
{
  // we're delegating to the string codec
  private readonly $$string: CrunchesString

  constructor() {
    super()
    this.$$string = new CrunchesString()
  }

  // propagate endianness to any "child" codecs
  bigEndian(): this {
    // only propagate if the child hasn't overridden its endianness
    if (undefined === this.$$string.isLittleEndian) {
      this.$$string.bigEndian()
    }
    return super.bigEndian()
  }

  decodeFrom(view: DataView, target: Target): Date {
    return new Date(this.$$string.decodeFrom(view, target))
  }

  encodeInto(value: CoercibleToDate, view: DataView, byteOffset: number): number {
    return this.$$string.encodeInto(new Date(value).toISOString(), view, byteOffset)
  }

  // propagate endianness to any "child" codecs
  littleEndian(): this {
    // only propagate if the child hasn't overridden its endianness
    if (undefined === this.$$string.isLittleEndian) {
      this.$$string.littleEndian()
    }
    return super.littleEndian()
  }

  sizeOf(value: CoercibleToDate): number {
    return this.$$string.sizeOf(new Date(value).toISOString())
  }
}

// export a small helper function to make things smooth for your consumers!
// using e.g. `string()` instead of `new CrunchesString()` is a nicer experience
export const mySuperCustomDate = () => new MySuperCustomDate()
```

This class is using `CrunchesString` to delegate encoding/decoding strings to/from the wire. All crunches codecs are available to import directly.

We're delegating to the `CrunchesString` codec for the methods, but we'll discuss them briefly.

- #### `decodeFrom`

  Decode and return a value from the `DataView`, starting at `target.byteOffset`. You **must** increment `target.byteOffset` by the number of bytes you consume from the `DataView` when decoding.

- #### `encodeInto`

  Encode `value` into the `DataView`, starting at `byteOffset`. You **must** return the number of bytes written to the `DataView`.

- #### `sizeOf`

  Return the computed size of `value` in bytes.

#### Using what we wrote

We could use the codec we just defined like so:

```ts
const schema = object({
  name: string(),
  when: mySuperCustomDate(),
})

const encoded = schema.encode({
  name: 'John Doe',
  when: 1234567890123,
})

expect(schema.decode(encoded)).to.deep.equal({
  name: 'John Doe',
  when: new Date('2009-02-13T23:31:30.123Z') // above timestamp equivalent as UTC date
})
```

## Motivation

[SchemaPack](https://github.com/phretaddin/schemapack/tree/master) (huge respect from and inspiration for this library! :heart:) is great for packing objects into Node buffers. Over time, this approach has become outdated in favor of modern standards like `ArrayBuffer`. I also took inspiration for fluent API design from [Zod](https://zod.dev/). Great library!

It is also frequently desirable to preallocate and reuse buffers for performance reasons. SchemaPack always allocates new buffers when encoding. The performance hit is generally less than the naive case since Node is good about buffer pooling, but performance degrades in the browser (and doesn't exist on any other platform). Buffer reuse is the Correct Way™. We also apply even more [optimizations of buffers and arrays](#buffers-and-arrays).

I also wanted an implementation that does amazing things like [boolean coalescence](#boolean-coalescence) and [optional fields](#optional-fields) (also with [coalescence](#optional-field-coalescence)) as well as supporting more even more types like `Map`s, `Set`s, `Date`s, etc.

## Notable differences from SchemaPack

### Monomorphic arrays

When defining arrays, the elements are all the same type. There is no mixing of types. If you need this, you might consider using an array of objects (which themselves maybe contain arrays).

### Prefixes

SchemaPack uses `varuint` prefixes for arrays, buffers, and strings. For speed, `crunches` uses 32-bit prefixes by default. A `varuint` prefix may be used for buffers and strings by providing a `varuint` key in the schema blueprint:

```ts
const schema = string({
  varuint: true,
})
// 6 = varuint prefix (1) + 'hello' (5)
expect(schema.size('hello')).to.equal(6)
```

**NOTE:** Strings may use one extra byte to encode the prefix than necessary. This is because [`string.length * 3`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto#buffer_sizing) is used to calculate the width of the `varuint` prefix. This expression will most likely overestimate the space required to store the string. One byte of space in certain cases is a better tradeoff than the space/time complexity required to calculate the true size in a performant way.

Arrays always use a 32-bit prefix and may not specify a `varuint` prefix. This is because any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) may be coerced into an array. It is technically possible to implement `varuint` prefixes in a performant way only for actual arrays (or `Set`s) which can be coered to `TypedArray`s, however it might be confusing as it would need to be ignored in cases even when it could be specified by the user and would introduce more implementation complexity.

### Buffers and arrays

A massive performance gain is achieved by copy-free buffer decoding. In other words, a buffer value is not copied out of the binary from which it is decoded; a `DataView` is created over the encoded binary and the `DataView` is returned. Decoding a 1024-byte buffer is ***10x faster*** on the machine used to benchmark. The gains increase even more as the size of the buffer increases.

A similar performance gain is also used for little-endian arrays. The fast path is used for arrays of the following types:

- `int8` (`Int8Array`)
- `uint8` (`Uint8Array`)
- `int16` (`Int16Array`)
- `uint16` (`Uint16Array`)
- `int32` (`Int32Array`)
- `uint32` (`Uint32Array`)
- `int64` (`BigInt64Array`)
- `uint64` (`BigUint64Array`)
- `float32` (`Float32Array`)
- `float64` (`Float64Array`)

Instead of copying the data from the buffer, a [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays#typed_array_views) is created over the encoded binary and returned instead. The same optimization is applied for encoding. This is roughly **1.5x** faster for encoding and ***50x*** faster for decoding a 1024-byte array on the machine used to benchmark. The gains increase even more as the size of the array increases.

**NOTE:** `TypedArray`s are padded with extra bytes if necessary to satisfy the [required alignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#byteoffset_must_be_aligned).

# Q/A

**Q**: Why did you call it `crunches`?  
**A**: 'cuz you gotta crunch those flabby AB(`ArrayBuffer`)s! 😋

# Benchmark

For entertainment purposes only.

(smaller is better)

```
> npm run benchmark

encoding x 10000
  SchemaPack              331.73 ms
  crunches (encodeInto)	  158.39 ms
  crunches (encode)	      272.38 ms
decoding x 10000 
  SchemaPack              223.71 ms
  crunches	              125.15 ms
```
