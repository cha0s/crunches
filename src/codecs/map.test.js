import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import ArrayCodec from './array.js';
import Codec from './map.js';
import ObjectCodec from './object.js';
import StringCodec from './string.js';
import Uint8Codec from './uint8.js';

Codecs.array = ArrayCodec;
Codecs.object = ObjectCodec;
Codecs.string = StringCodec;
Codecs.uint8 = Uint8Codec;

test('map', async () => {
  const codec = new Codec({
    key: {type: 'uint8'},
    value: {type: 'string'},
  });
  const value = new Map([[1, 'one'], [2, 'two']]);
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});

test('coerce map', async () => {
  const codec = new Codec({
    key: {type: 'uint8'},
    value: {type: 'string'},
  });
  const value = [[1, 'one'], [2, 'two']];
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(new Map(value));
});
