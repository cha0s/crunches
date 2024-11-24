import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import Codec from './object.js';
import BoolCodec from './uint8.js';
import Uint8Codec from './uint8.js';

Codecs.bool = BoolCodec;
Codecs.object = Codec;
Codecs.uint8 = Uint8Codec;

test('object', async () => {
  const codec = new Codec({
    properties: {
      1: {type: 'uint8'},
      2: {type: 'uint8'},
    },
  });
  const view = new DataView(new ArrayBuffer(codec.size({1: 32, 2: 32})));
  const written = codec.encode({1: 32, 2: 32}, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value: {1: 32, 2: 32}});
});

test('object boolean coalescence', async () => {
  let codec;
  const blueprint = {properties: {}};
  const value = {};
  for (let i = 0; i < 8; ++i) {
    blueprint.properties[i] = {type: 'bool'};
    value[i] = i;
  }
  codec = new Codec(blueprint);
  expect(codec.size(value)).to.equal(1);
  for (let i = 8; i < 16; ++i) {
    blueprint.properties[i] = {type: 'bool'};
    value[i] = i;
  }
  codec = new Codec(blueprint);
  expect(codec.size(value)).to.equal(2);
});

test('object optional coalescence', async () => {
  let codec;
  const blueprint = {properties: {}};
  const value = {};
  for (let i = 0; i < 8; ++i) {
    blueprint.properties[i] = {optional: true, type: 'uint8'};
    value[i] = i;
  }
  codec = new Codec(blueprint);
  expect(codec.size(value)).to.equal(8 + 1);
  for (let i = 8; i < 16; ++i) {
    blueprint.properties[i] = {optional: true, type: 'uint8'};
    value[i] = i;
  }
  codec = new Codec(blueprint);
  expect(codec.size(value)).to.equal(16 + 2);
});

test('object optional property', async () => {
  const codec = new Codec({
    properties: {
      1: {type: 'uint8'},
      2: {optional: true, type: 'uint8'},
      3: {
        optional: true,
        properties: {
          4: {optional: true, type: 'uint8'},
        },
        type: 'object',
      }
    },
  });
  expect(codec.size({1: 32, 2: 32, 3: {4: 32}})).to.equal(5);
  const view = new DataView(new ArrayBuffer(codec.size({1: 32, 2: 32, 3: {4: 32}})));
  let written;
  written = codec.encode({1: 32, 2: 32, 3: {4: 32}}, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value: {1: 32, 2: 32, 3: {4: 32}}});
  written = codec.encode({1: 32, 2: 32, 3: {}}, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value: {1: 32, 2: 32, 3: {}}});
  written = codec.encode({1: 32, 2: 32}, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value: {1: 32, 2: 32}});
  written = codec.encode({1: 32}, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value: {1: 32}});
});

test('object boolean properties', async () => {
  const blueprint = {properties: {}};
  const value = {};
  for (let i = 0; i < 8; ++i) {
    blueprint.properties[i] = {type: 'bool'};
    value[i] = !!(i % 2);
  }
  const codec = new Codec(blueprint);
  expect(codec.size(value)).to.equal(1);
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});

test('object boolean optional interaction', async () => {
  const blueprint = {properties: {}};
  const value = {};
  for (let i = 0; i < 8; ++i) {
    blueprint.properties[i] = {optional: true, type: 'bool'};
  }
  const codec = new Codec(blueprint);
  expect(codec.size(value)).to.equal(1);
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(written).to.equal(1);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});
