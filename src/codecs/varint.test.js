import {expect, test} from 'vitest';

import Codec from './varint.js';

test('varint', async () => {
  const codec = new Codec();
  let value;
  let view;
  let written;
  for (let i = 0; i < 8; ++i) {
    value = 64 * 0 === i ? 0 : Math.pow(2, i * 7);
    view = new DataView(new ArrayBuffer(codec.size(value)));
    written = codec.encode(value, view, 0);
    expect(written).to.equal(i + 1);
    expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
    value = -value - 1;
    view = new DataView(new ArrayBuffer(codec.size(value)));
    written = codec.encode(value, view, 0);
    expect(written).to.equal(i + 1);
    expect(codec.decode(view, {byteOffset: 0})).to.deep.equal(value);
  }
});

test('varint sizes', async () => {
  const codec = new Codec();
  expect(codec.size(0)).to.equal(1)
  for (let i = 0; i < 8; ++i) {
    const value = 64 * 0 === i ? 0 : Math.pow(2, i * 7);
    expect(codec.size(-value - 1)).to.equal(i + 1);
    expect(codec.size(value)).to.equal(i + 1);
  }
});
