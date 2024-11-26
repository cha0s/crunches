import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import Codec, {paddingForType, typeToElementClass} from './array.js';
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
    const ElementClass = typeToElementClass(numberType);
    const size = codec.size(value);
    expect(size).to.equal(4 + paddingForType(numberType) + ElementClass.BYTES_PER_ELEMENT * 4);
    const view = new DataView(new ArrayBuffer(size));
    expect(codec.encode(value, view, 0)).to.equal(size);
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

test('fixed-length uint8 array', async () => {
  const codec = new Codec({
    element: {type: 'uint8'},
    length: 4,
  });
  const value = [1, 2, 3, 4];
  const size = codec.size(value);
  expect(size).to.equal(4);
  const view = new DataView(new ArrayBuffer(size));
  expect(codec.encode(value, view, 0)).to.equal(size);
  expect(Array.from(codec.decode(view, {byteOffset: 0}))).to.deep.equal(value);
});

test('fixed-length float64 array', async () => {
  const codec = new Codec({
    element: {type: 'float64'},
    length: 4,
  });
  const value = [1, 2, 3, 4];
  const size = codec.size(value);
  expect(size).to.equal(32);
  const view = new DataView(new ArrayBuffer(size));
  expect(codec.encode(value, view, 0)).to.equal(size);
  expect(Array.from(codec.decode(view, {byteOffset: 0}))).to.deep.equal(value);
});

test('fixed-length string array', async () => {
  const codec = new Codec({
    element: {type: 'string'},
    length: 4,
  });
  const value = ['one', 'two', 'three', 'four'];
  const size = codec.size(value);
  expect(size).to.equal(value.reduce((size, string) => size + 4 + string.length, 0));
  const view = new DataView(new ArrayBuffer(size));
  expect(codec.encode(value, view, 0)).to.equal(size);
  expect(Array.from(codec.decode(view, {byteOffset: 0}))).to.deep.equal(value);
});

test('fixed-length string drop', async () => {
  const length = 3;
  const codec = new Codec({
    element: {type: 'string'},
    length,
  });
  const value = ['one', 'two', 'three', 'four'];
  const size = codec.size(value);
  expect(size).to.equal(value.slice(0, length).reduce((size, string) => size + 4 + string.length, 0));
  const view = new DataView(new ArrayBuffer(size));
  expect(codec.encode(value, view, 0)).to.equal(size);
  expect(Array.from(codec.decode(view, {byteOffset: 0}))).to.deep.equal(value.slice(0, length));
});

test('fixed-length string starved', async () => {
  const length = 3;
  const codec = new Codec({
    element: {type: 'string'},
    length,
  });
  const value = ['one', 'two'];
  expect(() => codec.size(value)).toThrowError();
  const view = new DataView(new ArrayBuffer(1024));
  expect(() => codec.encode(value, view, 0)).toThrowError();
});
