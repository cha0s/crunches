import {expect, test} from 'vitest';

import Codec from './bool.js';

test('bool', async () => {
  const codec = new Codec();
  const value = true;
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal(value);
});

test('coerced bool', async () => {
  const codec = new Codec();
  const value = 'truthy value';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal(!!value);
});
