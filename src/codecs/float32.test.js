import {expect, test} from 'vitest';

import Codec from './float32.js';

test('float32', async () => {
  const codec = new Codec();
  const value = 1 / 4;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});

test('float32 infinity', async () => {
  const codec = new Codec();
  const value = Infinity;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
