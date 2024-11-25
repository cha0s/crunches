import {expect, test} from 'vitest';

import Codec from './varuint.js';

test('varuint', async () => {
  const codec = new Codec();
  let view;
  let written;
  for (let i = 0; i < 8; ++i) {
    const value = 128 * 0 === i ? 0 : Math.pow(2, i * 7);
    view = new DataView(new ArrayBuffer(codec.size(value)));
    written = codec.encode(value, view);
    expect(written).to.equal(i + 1);
    expect(codec.decode(view)).to.deep.equal(value);
  }
});

test('varuint sizes', async () => {
  const codec = new Codec();
  expect(codec.size(0)).to.equal(1)
  for (let i = 0; i < 8; ++i) {
    expect(codec.size(128 * 0 === i ? 0 : Math.pow(2, i * 7))).to.equal(i + 1);
  }
});
