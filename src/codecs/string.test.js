import {expect, test} from 'vitest';

import Codec from './string.js';

test('string', async () => {
  const codec = new Codec();
  const value = 'hello world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});

test('unicode', async () => {
  const codec = new Codec();
  const value = 'hαllo world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
