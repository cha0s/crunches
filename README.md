![CI](https://github.com/cha0s/crunches/actions/workflows/ci.yml/badge.svg)

# crunches :muscle: 

The smallest **and** fastest JavaScript web standards-compliant value serialization library in the wild. **3.59 kB** gzipped; **0 dependencies**. Efficiently encode and decode your values to and from `ArrayBuffer`s. Integrates very well with WebSockets.

## Example

```js
import {Schema} from 'crunches';

const playerSchema = new Schema({
  type: 'object',
  properties: {
    position: {
      type: 'array',
      element: {type: 'float32'},
      length: 3,
    },
    health: {type: 'varuint'},
    jumping: {type: 'bool'},
    attributes: {
      type: 'object',
      properties: {
        str: {type: 'uint8'},
        agi: {type: 'uint8'},
        int: {type: 'uint8'},
      },
    },
  },
});
```

On the server:
```js
const player = {
  position: [-540.2378623, 343.183749, 1201.23897468],
  health: 4000,
  jumping: false,
  attributes: {str: 87, agi: 42, int: 22},
};

// encode the value to a new `DataView`
const view = playerSchema.encode(player);
// use some socket library to send the binary data...
socket.emit('player-data', view);
```

On the client:
```js
// use some socket library to receive the binary data...
socket.on('player-data', (buffer) => {
  const player = playerSchema.decode(buffer);
});
```

In this example, the size of payload is only **18 bytes**. `JSON.stringify` would consume **124 bytes**.

### Allocating a buffer and view

There is a convenience method which will allocate a view over a buffer sized to hold your value.

```js
// create a view for our value
const view = playerSchema.allocate(player);
// pass the view to the encoder
playerSchema.encodeInto(player, view);
```

It can be useful for performance reasons to reuse your buffers.

This is sugar over the following:

```js
// get the schema size
const size = playerSchema.size(player);
// allocate a buffer
const buffer = new ArrayBuffer(size);
// create a view over the buffer
const view = new DataView(buffer);
// pass the view to the encoder
playerSchema.encodeInto(player, view);
```

You may `encodeInto` a view over any existing `ArrayBuffer` **provided that it's large enough to contain the encoded payload**.

## Primitive types

| Type Name             | Bytes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Range of Values                                                                                                                                                                                                |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| bool (alias: boolean) | 1 (worst case, see [boolean coalescence](#boolean-coalescence))                                                                                                                                                                                                                                                                                                                                                                                                                                   | Truthy values are coerced to `true`; falsy values to `false`                                                                                                                                                   |
| int8                  | 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -128 to 127                                                                                                                                                                                                    |
| uint8                 | 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 255                                                                                                                                                                                                       |
| int16                 | 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -32,768 to 32,767                                                                                                                                                                                              |
| uint16                | 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 65,535                                                                                                                                                                                                    |
| int32                 | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -2,147,483,648 to 2,147,483,647                                                                                                                                                                                |
| uint32                | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 4,294,967,295                                                                                                                                                                                             |
| int64                 | 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807<br /><br />**NOTE:** Only accepts and decodes to [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)s. |
| uint64                | 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 18,446,744,073,709,551,615<br /><br />**NOTE:** Only accepts and decodes to [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)s.                         |
| float32               | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 3.4E +/- 38 (7 digits)                                                                                                                                                                                         |
| float64               | 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 1.7E +/- 308 (15 digits)                                                                                                                                                                                       |
| string                | [Prefix](#varuint-prefixes) followed by the [encoded](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto) string bytes                                                                                                                                                                                                                                                                                                                                                       | Any string                                                                                                                                                                                                     |
| buffer                | [Prefix](#varuint-prefixes) followed by the bytes of the buffer                                                                                                                                                                                                                                                                                                                                                                                                                                   | Any `ArrayBuffer`<br /><br />**NOTE:** Decodes to a `DataView`.<br /><br />See: [buffers and arrays](#buffers-and-arrays).                                                                                     |
| varuint               | <table><tr><th>size</th><th>min</th><th>max</th></tr><tr><td>1</td><td>0</td><td>127</td></tr><tr><td>2</td><td>128</td><td>16,383</td></tr><tr><td>3</td><td>16,384</td><td>2,097,151</td></tr><tr><td>4</td><td>2,097,152</td><td>268,435,455</td></tr><tr><td>5</td><td>268,435,456</td><td>34,359,738,367</td></tr><tr><td>6</td><td>34,359,738,368</td><td>4,398,046,511,103</td></tr><tr><td>7</td><td>4,398,046,511,104</td><td>562,949,953,421,311</td></tr></table>                      | 0 to 562,949,953,421,311                                                                                                                                                                                       |
| varint                | <table><tr><th>size</th><th>min</th><th>max</th></tr><tr><td>1</td><td>-64</td><td>63</td></tr><tr><td>2</td><td>-8,192</td><td>8,191</td></tr><tr><td>3</td><td>-1,048,576</td><td>1,048,575</td></tr><tr><td>4</td><td>-134,217,728</td><td>134,217,727</td></tr><tr><td>5</td><td>-17,179,869,184</td><td>17,179,869,183</td></tr><tr><td>6</td><td>-2,199,023,255,552</td><td>2,199,023,255,551</td></tr><tr><td>7</td><td>-281,474,976,710,656</td><td>281,474,976,710,655</td></tr></table> | -281,474,976,710,656 to 281,474,976,710,655                                                                                                                                                                    |
| date                  | Same as `string` above after calling [`toIsoString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)                                                                                                                                                                                                                                                                                                                                           | Value is coerced to `Date` e.g. `new Date(value).toIsoString()`                                                                                                                                                |

## Aggregate types

### `object`

Requires a `properties` key to define the properties on the object. Supports [`optional` fields](#optional-fields). Booleans are [coalesced](#boolean-coalescence).

Example:

```js
const schema = new Schema({
  type: 'object',
  properties: {
    foo: {type: 'uint32'},
    bar: {type: 'string', optional: true},
  },
});

// 14 = uint32 (4) + optional flag (1) + string prefix (4) + 'hello' (5)
console.log(schema.size({foo: 32, bar: 'hello'}));
// 5 = uint32 (4) + optional flag (1)
console.log(schema.size({foo: 32}));
```

### `array`

Requires an `element` key to define the structure of the array elements. Encodes a 32-bit prefix followed by the contents of the array.

```js
const schema = new Schema({
  type: 'array',
  element: {type: 'uint32'},
});

// 16 = array prefix (4) + uint32 (4) + uint32 (4) + uint32 (4)
console.log(schema.size([1, 2, 3]));
```

Arrays of number types decode to [the corresponding `TypedArray`](#buffers-and-arrays).

#### Fixed-length arrays

Arrays may be specified as fixed-length through the `length` key.

```js
const schema = new Schema({
  type: 'array',
  element: {type: 'uint32'},
  length: 3,
});

// 12 = uint32 (4) + uint32 (4) + uint32 (4)
console.log(schema.size([1, 2, 3]));
```

No prefix is written, saving 4 bytes!

### `map`

Requires a `key` and `value` key to define the structure of the map. Any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) will be coerced as [entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map#iterable). Encoded as an array of entries. Decodes to a native `Map` object.

```js
const schema = new Schema({
  type: 'map',
  key: {type: 'int32'},
  value: {type: 'string'},
});

const value = new Map();
value.set(32, 'sup');
value.set(64, 'hi');

// 25 = array prefix (4) + int32 (4) + string prefix (4) + 'sup' (3) + int32 (4) + string prefix (4) + 'hi' (2)
console.log(schema.size(value));
// same, with coercion
console.log(schema.size([[32, 'sup'], [64, 'hi']]));
```

### `set`

Requires an `element` key to define the structure of the map. Any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) will be coerced. Encoded as an array. Decodes to a native `Set` object.

```js
const schema = new Schema({
  type: 'set',
  element: {type: 'string'},
});

const set = new Set();
set.add('foo');
set.add('bar');

// 18 = array prefix (4) + string prefix (4) + 'foo' (3) + string prefix (4) + 'bar' (3)
console.log(schema.size(set));
// same, with coercion
console.log(schema.size(['foo', 'bar']));
```

## :fire: features

### Boolean coalescence

Any computer scientist worth their salt secretly wonders whether their `bool` type actually takes a single bit of space. The `crunches` answer is: **ideally, yes!**

The reason it's not an unequivocal "yes" is because there is no actual bit-width primitive when dealing with `DataView`s in JavaScript. **However**, boolean fields are packed as much as possible.

In other words, if you have an object with 2 boolean fields, the object itself will encode to **1 byte**! This is the case all the way up to 8 boolean fields. If you add another, the object encodes to **2 bytes**, up until you have more than 16 boolean fields!

More concretely, packing boolean fields takes

```js
Math.ceil(numberOfBooleanFields / 8)
```

bytes of space.

### Optional fields

An object schema blueprint may specify an `optional` attribute on its fields. If the value is `undefined` upon encoding, the field will be encoded as not present. Upon decoding, the presence flag is checked and if the value is not present, the value decoding will be skipped and `undefined` will be returned as the decoded value.

This is a great alternative for rolling updates to a monolithic state, which would otherwise have to be individually defined for every discrete slice of state that could update.

Using the original example with all optional fields:

```js
const stateSchema = new Schema({
  type: 'object',
  properties: {
    position: {
      type: 'array',
      element: {type: 'float32'},
      length: 3,
      optional: true,
    },
    health: {type: 'varuint', optional: true},
    jumping: {type: 'bool', optional: true},
    attributes: {
      type: 'object',
      properties: {
        str: {type: 'uint8'},
        agi: {type: 'uint8'},
        int: {type: 'uint8'},
      },
      optional: true,
    },
  },
});
```

if we were to check the size of a completely blank update:

```js
console.log(stateSchema.size({}));
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

`crunches` defaults to little-endian byte ordering to align with the majority of machines'
implementation of `TypedArray`. This may be overridden when calling `encode`/`decode` through the
`isLittleEndian` flag. An excerpt of the above example has been modified to illustrate the change:

On the server:
```js
// encode the value to a new `DataView`
const view = playerSchema.encode(player, {isLittleEndian: false});
```

On the client:
```js
const player = playerSchema.decode(buffer, {isLittleEndian: false});
```

**NOTE:** Make sure you're using the same byte ordering on both ends!

### Extensible

You may define your own codecs that handle encoding and decoding values. There is no base `Codec` class to inherit from, but your codec must implement an interface ([quack quack](https://en.wikipedia.org/wiki/Duck_typing)):

```js
class YourCodec {

  // return the value
  decode(view: DataView, target: {byteOffset: number, isLittleEndian: bool}): any

  // return the number of bytes written
  encode(value: any, view: DataView, byteOffset: number, isLittleEndian: bool): number

  // get the encoded size of a value; accept an offset to calculate any relevant padding necessary
  size(value: any, byteOffset: number): number

}
```

The following is how the `date` codec is actually implemented with slight adjustment for demonstration purposes. It serves as an example of how you can easily extend the primitive codecs to suit your needs:

```js
import {Codecs} from 'crunches';

// will coerce strings to `Date`s
class MyDateCodec extends Codecs.string {

  decode(view, target) {
    // let the `string` codec decode the string
    const decoded = super.decode(view, target);
    // pass it to the `Date` constructor
    return new Date(decoded);
  }

  encode(value, view, byteOffset, isLittleEndian) {
    // convert it to a string
    const converted = new Date(value).toISOString();
    // pass it along to the `string` codec's encode method
    return super.encode(converted, view, byteOffset, isLittleEndian);
  }

  size(value) {
    // convert it to a string
    const converted = new Date(value).toISOString();
    // pass it along to the `string` codec's size method
    return super.size(converted);
  }

}

Codecs.myDate = MyDateCodec;
```

All this codec does is coerce `Date`s to and from strings. It leans on the built-in `string` codec to handle the actual over-the-wire encoding and string size calculation.

Inside your codec, you must increment `target.byteOffset` as you decode bytes.

Just set a key on the `Codecs` object and go. Too easy!

### Type aliases

You may add type aliases:

```js
import {Aliases, Schema} from 'crunches';

Aliases.foobar = 'bool';

const schema = new Schema({
  type: 'foobar',
});

console.log(schema.size()); // 1, because it's a bool
```

## Motivation

[SchemaPack](https://github.com/phretaddin/schemapack/tree/master) (huge respect from and inspiration for this library! :heart:) is great for packing objects into Node buffers. Over time, this approach has become outdated in favor of modern standards like `ArrayBuffer`.

It is also frequently desirable to preallocate and reuse buffers for performance reasons. SchemaPack always allocates new buffers when encoding. The performance hit is generally less than the naive case since Node is good about buffer pooling, but performance degrades in the browser (and doesn't exist on any other platform). Buffer reuse is the Correct Way™. We also apply even more [optimizations of buffers and arrays](#buffers-and-arrays).

I also wanted an implementation that does amazing things like [boolean coalescence](#boolean-coalescence) and [optional fields](#optional-fields) (also with [coalescence](#optional-field-coalescence)) as well as supporting more even more types like `Map`s, `Set`s, `Date`s, etc.

## Notable differences from SchemaPack

### Monomorphic arrays

When defining arrays, the elements are all the same type. There is no mixing of types. If you need this, you should probably be using an array of objects (which themselves maybe contain arrays).

### No validation

No validation is done on the values you encode. If you'd like to validate your values, try something like [Zod](https://github.com/colinhacks/zod#basic-usage).

### Blueprint verbosity

Defining schema blueprints are slightly more verbose than SchemaPack. The tradeoff is that we're able to define more aggregate types like `Set`, `Map`, fixed-length arrays, optional `varuint` prefixes, and have made space for even more in the future.

### Varint expansion

SchemaPack's `varint` types only work up to $2^{30}-1$ whereas `crunches` uses mathematical transformations (instead of bitwise) to allow numbers up to [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER). In practice, due to sacrificing space for the length flags, this is $2^{48}-1$. Same goes for `varuint`: $2^{31}-1$ vs. $2^{49}-1$.

### Varuint prefixes

SchemaPack uses `varuint` prefixes for arrays, buffers, and strings. For speed, `crunches` uses 32-bit prefixes by default. A `varuint` prefix may be used for buffers and strings by providing a `varuint` key in the schema blueprint:

```js
const schema = new Schema({
  type: 'string',
  varuint: true,
});
// 6 = varuint prefix (1) + 'hello' (5)
console.log(schema.size('hello'));
```

**NOTE:** Strings may use one extra byte to encode the prefix than necessary. This is because [`string.length * 3`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto#buffer_sizing) is used to calculate the width of the `varuint` prefix. This expression will most likely overestimate the space required to store the string. One byte of space in certain cases is a better tradeoff than the space/time complexity required to calculate the true size in a performant way.

Arrays always use a 32-bit prefix and may not specify a `varuint` prefix. This is because any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) may be coerced into an array. It is technically possible to implement `varuint` prefixes in a performant way only for actual arrays (or `Set`s) which can be coered to `TypedArray`s, however it might be confusing as it would need to be ignored in cases even when it could be specified by the user and would introduce more implementation complexity.

### Buffers and arrays

A massive performance gain is achieved by copy-free buffer decoding. In other words, a buffer value is not copied out of the binary from which it is decoded; a `DataView` is created over the encoded binary and the `DataView` is returned. Decoding a 1024-byte buffer is ***10x faster*** on the machine used to benchmark. The gains increase even more as the size of the buffer increases.

A similar performance gain is also used for arrays. The fast path is used for arrays of the following types:

- `int8`
- `uint8`
- `int16`
- `uint16`
- `int32`
- `uint32`
- `int64`
- `uint64`
- `float32`
- `float64`

Instead of copying the data from the buffer, a [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays#typed_array_views) is created over the encoded binary and returned instead. The same optimization is applied for encoding. This is roughly **1.5x** faster for encoding and ***50x*** faster for decoding a 1024-byte array on the machine used to benchmark. The gains increase even more as the size of the array increases.

**NOTE:** `float64` arrays are padded with an extra 4 bytes after the length prefix to satisfy the required 8-byte alignment.

# Q/A

**Q**: Why did you call it `crunches`?  
**A**: 'cuz you gotta crunch those flabby AB(`ArrayBuffer`)s!

**Q**: Why no TypeScript support?  
**A**: Feel free to contribute typing!

**Q**: How fast is it, overall?  
**A**: Benchmarks are generally dubious in my opinion, but the `benchmark.js` script included in the repository runs 50,000 iterations of both SchemaPack and `crunches` encoding and decoding a schema. SchemaPack validation is disabled, to be as fair as possible. On the machine used to benchmark, `crunches` runs consistently **2-4x faster** than SchemaPack.
