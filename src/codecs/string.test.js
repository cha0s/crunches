import {expect, test} from 'vitest';

import Codec from './string.js';

test('string', async () => {
  const codec = new Codec();
  const value = 'hello world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  expect(codec.encode(value, view, 0)).to.equal(15);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
  expect(codec.encode('', view, 0)).to.equal(4);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal('');
});

test('unicode', async () => {
  const codec = new Codec();
  const value = 'hαllo world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  codec.encode(value, view, 0);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});

test('varuint-prefixed string', async () => {
  const codec = new Codec({varuint: true});
  const value = 'hello world';
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view, 0);
  expect(written).to.equal(12);
  expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
});
