![CI](https://github.com/cha0s/crunches/actions/workflows/ci.yml/badge.svg)

# crunches :muscle: 

The (as of the time of writing this) smallest **and** fastest JavaScript value serialization library in the wild. **2.3 kB** gzipped. Efficiently encode and decode your values to and from `ArrayBuffer`s. Integrates very well with WebSockets.

## Example

```js
import {Schema} from 'crunches';

const playerSchema = new Schema({
  type: 'object',
  properties: {
    health: {type: 'varuint'},
    jumping: {type: 'bool'},
    position: {
      type: 'array',
      element: {type: 'float32'},
    },
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
  health: 4000,
  jumping: false,
  position: [-540.2378623, 343.183749, 1201.23897468],
  attributes: {str: 87, agi: 42, int: 22},
};

// get the schema size
const size = playerSchema.size(player);
// allocate a buffer
const buffer = new ArrayBuffer(size);
// create a view over the buffer
const view = new DataView(buffer);
// pass the view to the encoder
const written = playerSchema.encode(player, view);
// the encoder returns the number of bytes written
console.log(written); // 22
// use some socket library to send the binary data...
socket.emit('player-data', buffer);
```

On the client:
```js
// use some socket library to receive the binary data...
socket.on('player-data', (buffer) => {
  // create a view over the buffer
  const view = new DataView(buffer);
  // pass the view to the decoder to get the value
  const player = playerSchema.decode(view);
});
```

In this example, the size of payload is only **22 bytes**. `JSON.stringify` would consume **124 bytes**.

## Motivation

[SchemaPack](https://github.com/phretaddin/schemapack/tree/master) (huge respect from and inspiration for this library! :heart:) is great for packing objects into Node buffers. Over time, this approach has become outdated in favor of modern standards like `ArrayBuffer`.

It is also frequently desirable to preallocate and reuse buffers for performance reasons. SchemaPack always allocates new buffers when encoding. The performance hit is generally less than the naive case since Node is good about buffer pooling, but performance degrades in the browser (and doesn't exist on any other platform). Buffer reuse is the Correct Way™.

I also wanted an implementation that does amazing things like [boolean coalescence](#boolean-coalescence) and [optional fields](#optional-fields) (also with [coalescence](#optional-field-coalescence)) as well as supporting more even more types like `Map`s, `Set`s, `Date`s, etc.

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
    health: {type: 'varuint', optional: true},
    jumping: {type: 'bool', optional: true},
    position: {
      type: 'array',
      element: {type: 'float32'},
      optional: true,
    },
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

### Extensible

You may define your own codecs that handle encoding and decoding values. There is no base `Codec` class to inherit from, but your codec must implement an interface ([quack quack](https://en.wikipedia.org/wiki/Duck_typing)):

```js
class YourCodec {

  // return the value
  decode(view: DataView, target: {byteOffset: number}): any

  // return the number of bytes written
  encode(value: any, view: DataView, byteOffset: number): number

  // get the encoded size of a value
  size(value: any): number

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

  encode(value, view, byteOffset) {
    // convert it to a string
    const converted = new Date(value).toISOString();
    // pass it along to the `string` codec's encode method
    return super.encode(converted, view, byteOffset);
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

## Schema types

| Type Name | Bytes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Range of Values                                                                                                                       |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| bool      | 1 (worst case, see [boolean coalescence](#boolean-coalescence))                                                                                                                                                                                                                                                                                                                                                                                                                                   | Truthy values are coerced to `true`; falsy values to `false`                                                                          |
| int8      | 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -128 to 127                                                                                                                           |
| uint8     | 1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 255                                                                                                                              |
| int16     | 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -32,768 to 32,767                                                                                                                     |
| uint16    | 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 65,535                                                                                                                           |
| int32     | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | -2,147,483,648 to 2,147,483,647                                                                                                       |
| uint32    | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 0 to 4,294,967,295                                                                                                                    |
| float32   | 4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 3.4E +/- 38 (7 digits)                                                                                                                |
| float64   | 8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 1.7E +/- 308 (15 digits)                                                                                                              |
| string    | 32-bit length prefix followed by the [encoded](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto) string bytes                                                                                                                                                                                                                                                                                                                                                              | Any string                                                                                                                            |
| buffer    | 32-bit length prefix followed by the bytes of the buffer                                                                                                                                                                                                                                                                                                                                                                                                                                          | Any `ArrayBuffer`<br /><br />**NOTE:** For performance, a `DataView` of the buffer is returned when decoding to avoid buffer copying. |
| varuint   | <table><tr><th>size</th><th>min</th><th>max</th></tr><tr><td>1</td><td>0</td><td>127</td></tr><tr><td>2</td><td>128</td><td>16,383</td></tr><tr><td>3</td><td>16,384</td><td>2,097,151</td></tr><tr><td>4</td><td>2,097,152</td><td>268,435,455</td></tr><tr><td>5</td><td>268,435,456</td><td>34,359,738,367</td></tr><tr><td>6</td><td>34,359,738,368</td><td>4,398,046,511,103</td></tr><tr><td>7</td><td>4,398,046,511,104</td><td>562,949,953,421,311</td></tr></table>                      | 0 to 562,949,953,421,311                                                                                                              |
| varint    | <table><tr><th>size</th><th>min</th><th>max</th></tr><tr><td>1</td><td>-64</td><td>63</td></tr><tr><td>2</td><td>-8,192</td><td>8,191</td></tr><tr><td>3</td><td>-1,048,576</td><td>1,048,575</td></tr><tr><td>4</td><td>-134,217,728</td><td>134,217,727</td></tr><tr><td>5</td><td>-17,179,869,184</td><td>17,179,869,183</td></tr><tr><td>6</td><td>-2,199,023,255,552</td><td>2,199,023,255,551</td></tr><tr><td>7</td><td>-281,474,976,710,656</td><td>281,474,976,710,655</td></tr></table> | -281,474,976,710,656 to 281,474,976,710,655                                                                                           |
| date      | Same as `string` above after calling [`toIsoString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)                                                                                                                                                                                                                                                                                                                                           | Value is coerced to `Date` e.g. `new Date(value).toIsoString()`                                                                       |

### Aggregate types

#### `object`

> Requires a `properties` key to define the properties on the object. Supports [`optional` fields](#optional-fields). Booleans are [coalesced](#boolean-coalescence).

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

#### `array`

> Requires an `element` key to define the structure of the array elements. Encodes a 32-bit prefix followed by the contents of the array.

```js
const schema = new Schema({
  type: 'array',
  element: {type: 'uint32'},
});

// 16 = array prefix (4) + uint32 (4) + uint32 (4) + uint32 (4)
console.log(schema.size([1, 2, 3]));
```

#### `map`

> Requires a `key` and `value` key to define the structure of the map. Any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) will be coerced as [entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/Map#iterable). Encoded as an array of entries. Decodes to a native `Map` object.

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

#### `set`

> Requires an `element` key to define the structure of the map. Any [iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) will be coerced. Encoded as an array. Decodes to a native `Set` object.

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
## Notable differences from SchemaPack

### Monomorphic arrays

When defining arrays, the elements are all the same type. There is no mixing of types. If you need this, you should probably be using an array of objects (which themselves maybe contain arrays).

### No validation

No validation is done on the values you encode. If you'd like to validate your values, try something like [Zod](https://github.com/colinhacks/zod#basic-usage).

### Blueprint verbosity

Defining schema blueprints are slightly more verbose than SchemaPack. The tradeoff is that we're able to define more aggregate types like `Set`, `Map`, and maybe others in the future. While technically possible to allow e.g. a `Map` object in a blueprint, it would be even more cumbersome in my opinion.

### Varint expansion

SchemaPack's `varint` types only work up to $2^{30}-1$ whereas `crunches` uses mathematical transformations (instead of bitwise) to allow numbers up to [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER). In practice, due to sacrificing space for the length flags, this is $2^{48}-1$. Same goes for `varuint`: $2^{31}-1$ vs. $2^{49}-1$.

# TODO

- Fixed-length arrays
- Coalescence for boolean arrays?
- Sparse arrays/optional elements?
- Type aliases?
- BigInts?
- Endianness?

# Q/A

**Q**: Why did you call it `crunches`?  
**A**: 'cuz you gotta crunch those flabby AB(`ArrayBuffer`)s!

**Q**: Why no TypeScript support?  
**A**: Feel free to create an issue.

**Q**: This library isn't **always** faster than SchemaPack!  
**A**: That's true, at least for now. SchemaPack does a lot of black magic and compiles codecs on-the-fly. However, it is consistently faster when using larger aggregate types even in its current state.
