import {expect, test} from 'vitest';

import Codec from './date.js';

test('date', async () => {
  const codec = new Codec();
  const value = new Date('2024-11-24T18:58:48.912Z');
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  const decoded = codec.decode(view, {byteOffset: 0});
  expect(decoded).to.be.instanceOf(Date);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});

test('coerce date', async () => {
  const codec = new Codec();
  const value = '2024-11-24T18:58:48.912Z';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  const decoded = codec.decode(view, {byteOffset: 0});
  expect(decoded).to.be.instanceOf(Date);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(new Date(value));
});
