import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import Codec from './array.js';
import Uint8Codec from './uint8.js';
import Int8Codec from './int8.js';
import Int16Codec from './int16.js';
import Uint16Codec from './uint16.js';
import Int32Codec from './int32.js';
import Uint32Codec from './uint32.js';
import Float32Codec from './float32.js';
import Float64Codec from './float64.js';
import StringCodec from './string.js';

Codecs.uint8 = Uint8Codec;
Codecs.int8 = Int8Codec;
Codecs.uint8 = Uint8Codec;
Codecs.int16 = Int16Codec;
Codecs.uint16 = Uint16Codec;
Codecs.int32 = Int32Codec;
Codecs.uint32 = Uint32Codec;
Codecs.float32 = Float32Codec;
Codecs.float64 = Float64Codec;
Codecs.string = StringCodec;

for (const numberType of [
  'int8',
  'uint8',
  'int16',
  'uint16',
  'int32',
  'uint32',
  'float32',
  'float64',
]) {
  test(`${numberType} array`, async () => {
    const codec = new Codec({
      element: {type: numberType},
    });
    const value = [1, 2, 3, 4];
    const view = new DataView(new ArrayBuffer(codec.size(value)));
    codec.encode(value, view, 0);
    expect(Array.from(codec.decode(view, {byteOffset: 0}))).to.deep.equal(value);
  });
}

test('string array', async () => {
  const codec = new Codec({
    element: {type: 'string'},
  });
  const value = ['one', 'two', 'three', 'four'];
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
