import {expect, test} from 'vitest';

import Codec from './float64.js';

test('float64', async () => {
  const codec = new Codec();
  const value = 1 / 7;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});

test('float64 infinity', async () => {
  const codec = new Codec();
  const value = Infinity;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});
