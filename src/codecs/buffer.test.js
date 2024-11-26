import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import ArrayCodec from './array.js';
import Codec from './buffer.js';
import MapCodec from './map.js';
import ObjectCodec from './object.js';
import StringCodec from './string.js';
import Uint8Codec from './uint8.js';

Codecs.array = ArrayCodec;
Codecs.map = MapCodec;
Codecs.object = ObjectCodec;
Codecs.string = StringCodec;
Codecs.uint8 = Uint8Codec;

test('buffer', async () => {
  const mapSchema = new MapCodec({
    key: {type: 'uint8'},
    value: {type: 'string'},
  });
  const value = new Map([[1, 'one'], [2, 'two']]);
  const mapView = new DataView(new ArrayBuffer(mapSchema.size(value)));
  const mapEncodedSize = mapSchema.encode(value, mapView, 0);
  const bufferSchema = new Codec();
  const bufferView = new DataView(new ArrayBuffer(bufferSchema.size(mapView.buffer)));
  expect(bufferSchema.encode(mapView.buffer, bufferView, 0)).to.equal(mapEncodedSize + 4);
  const newMapView = bufferSchema.decode(bufferView, {byteOffset: 0});
  expect(mapSchema.decode(newMapView, {byteOffset: 0})).to.deep.equal(value);
});

test('varuint-prefixed buffer', async () => {
  const mapSchema = new MapCodec({
    key: {type: 'uint8'},
    value: {type: 'string'},
  });
  const value = new Map([[1, 'one'], [2, 'two']]);
  const mapView = new DataView(new ArrayBuffer(mapSchema.size(value)));
  const mapEncodedSize = mapSchema.encode(value, mapView, 0);
  const bufferSchema = new Codec({varuint: true});
  const bufferView = new DataView(new ArrayBuffer(bufferSchema.size(mapView.buffer)));
  bufferSchema.encode(mapView.buffer, bufferView, 0);
  expect(bufferSchema.encode(mapView.buffer, bufferView, 0)).to.equal(mapEncodedSize + 1);
  const newMapView = bufferSchema.decode(bufferView, {byteOffset: 0});
  expect(mapSchema.decode(newMapView, {byteOffset: 0})).to.deep.equal(value);
});
