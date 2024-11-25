import {expect, test} from 'vitest';

import Codec from './int32.js';

test('int32', async () => {
  const codec = new Codec();
  const value = 32;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal(value);
});
