import {expect, test} from 'vitest';

import Codec from './date.js';

test('date', async () => {
  const codec = new Codec();
  const value = new Date('2024-11-24T18:58:48.912Z');
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  const decoded = codec.decode(view);
  expect(decoded).to.be.instanceOf(Date);
  expect(codec.decode(view)).to.deep.equal(value);
});

test('coerce date', async () => {
  const codec = new Codec();
  const value = '2024-11-24T18:58:48.912Z';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view);
  const decoded = codec.decode(view);
  expect(decoded).to.be.instanceOf(Date);
  expect(codec.decode(view)).to.deep.equal(new Date(value));
});
