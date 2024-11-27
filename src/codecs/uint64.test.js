import {expect, test} from 'vitest';

import Codec from './uint64.js';

test('uint64', async () => {
  const codec = new Codec();
  const value = 32n;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  expect(codec.encode(value, view, 0)).to.equal(8);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
