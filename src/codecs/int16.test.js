import {expect, test} from 'vitest';

import Codec from './int16.js';

test('int16', async () => {
  const codec = new Codec();
  const value = 32;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
