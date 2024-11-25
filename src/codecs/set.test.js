import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import Codec from './set.js';
import Uint8Codec from './uint8.js';

Codecs.uint8 = Uint8Codec;

test('set', async () => {
  const codec = new Codec({
    element: {type: 'uint8'},
  });
  const value = new Set([1, 2, 3, 4]);
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal(value);
});

test('coerce set', async () => {
  const codec = new Codec({
    element: {type: 'uint8'},
  });
  const value = [1, 2, 3, 4];
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal(new Set(value));
});
