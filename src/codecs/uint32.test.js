import {expect, test} from 'vitest';

import Codec from './uint32.js';

test('uint32', async () => {
  const codec = new Codec();
  const value = 32;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
