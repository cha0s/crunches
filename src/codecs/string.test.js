import {expect, test} from 'vitest';

import Codec from './string.js';

test('string', async () => {
  const codec = new Codec();
  const value = 'hello world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});

test('unicode', async () => {
  const codec = new Codec();
  const value = 'hαllo world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});
