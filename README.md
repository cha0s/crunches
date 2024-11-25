![CI](https://github.com/cha0s/crunches/actions/workflows/ci.yml/badge.svg)

# crunches :muscle: 

The (as of the time of writing this) smallest **and** fastest JavaScript value serialization library in the wild. **2 kB** gzipped. Efficiently encode and decode your values to and from `ArrayBuffer`s. Integrates very well with WebSockets.

## Example

```js
import {Schema} from 'crunches';

const playerSchema = new Schema({
  health: {type: 'int32'},
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
console.log(written); // 24
// use some socket library to send the binary data...
socket.emit('player-data', buffer);
```

On the client:
```js
// use some socket library to receive the binary data...
socket.on('player-data', (buffer) => {
  // create a view over the buffer
  const view = new DataView(buffer);
  // pass the view to the decoder
  const decoded = playerSchema.decode(view);
  // the decoder returns the number of bytes read and the value
  console.log(decoded); // {read: 24, value: {...}}
  const player = decoded.value;
  // or if you're feeling elegant,
  const {value: player} = playerSchema.decode(new DataView(buffer));
}
```

In this example, the size of payload is only **24 bytes**. `JSON.stringify` would consume **124 bytes**.

## Motivation

[SchemaPack](https://github.com/phretaddin/schemapack/tree/master) (huge respect from and inspiration for this library! :heart:) is great for packing objects into Node buffers. Over time, this approach has become outdated in favor of modern standards like `ArrayBuffer`.

It is also frequently desirable to preallocate and reuse buffers for performance reasons. SchemaPack always allocates new buffers when encoding. The performance hit is generally less than the naive case since Node is good about buffer pooling, but performance degrades in the browser (and doesn't exist on any other platform). Buffer reuse is the Correct Way™. Even with Node's pooling, we are still roughly **twice as fast as SchemaPack**. (We could probably get even faster if we did crazy stuff like compiled unrolled codecs like SchemaPack does. PRs along those lines would be interesting if there's big gains! :muscle:)

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
    health: {type: 'int32', optional: true},
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

  // return the number of bytes read and the value
  decode(view: DataView, byteOffset = 0): {read: number, value: any}

  // return the number of bytes written
  encode(value: any, view: DataView, byteOffset = 0): number

  size(value: any): number

}
```

The following is how the `date` codec is actually implemented with slight adjustment for demonstration purposes. It serves as an example of how you can easily extend the primitive codecs to suit your needs:

```js
import {Codecs} from 'crunches';

// will coerce strings to `Date`s
class MyDateCodec extends Codecs.string {

  decode(view, byteOffset = 0) {
    // let the `string` codec decode the string
    const decoded = super.decode(view, byteOffset);
    // pass it to the `Date` constructor
    return {read: decoded.read, value: new Date(decoded.value)};
  }

  encode(value, view, byteOffset = 0) {
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

Just set a key on the `Codecs` object and go. Too easy!

## Schema types

| Type Name | Bytes                                                                                                                                                   | Range of Values                                                 |
|-----------|---------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| bool      | 1 (worst case, see [boolean coalescence](#boolean-coalescence))                                                                                         | Truthy values are coerced to `true`; falsy values to `false`    |
| int8      | 1                                                                                                                                                       | -128 to 127                                                     |
| uint8     | 1                                                                                                                                                       | 0 to 255                                                        |
| int16     | 2                                                                                                                                                       | -32,768 to 32,767                                               |
| uint16    | 2                                                                                                                                                       | 0 to 65,535                                                     |
| int32     | 4                                                                                                                                                       | -2,147,483,648 to 2,147,483,647                                 |
| uint32    | 4                                                                                                                                                       | 0 to 4,294,967,295                                              |
| float32   | 4                                                                                                                                                       | 3.4E +/- 38 (7 digits)                                          |
| float64   | 8                                                                                                                                                       | 1.7E +/- 308 (15 digits)                                        |
| string    | 32-bit length prefix followed by the [encoded](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto) string bytes                    | Any string                                                      |
| buffer    | 32-bit length prefix followed by the bytes of the buffer                                                                                                | Any `ArrayBuffer`                                               |
| date      | Same as `string` above after calling [`toIsoString`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) | Value is coerced to `Date` e.g. `new Date(value).toIsoString()` |

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

# TODO

- Fixed-length arrays
- Coalescence for boolean arrays?
- Sparse arrays/optional elements?
- Type aliases?
- Less-verbose blueprint?
- BigInts?
- Endianness?
- Varint?

# Q/A

**Q**: Why did you call it `crunches`?  
**A**: 'cuz you gotta crunch those flabby AB(`ArrayBuffer`)s!

**Q**: Why no TypeScript support?  
**A**: Feel free to create an issue.
