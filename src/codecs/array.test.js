import {expect, test} from 'vitest';

import {Codecs} from '../codecs.js';
import Codec from './array.js';
import Uint8Codec from './uint8.js';

Codecs.uint8 = Uint8Codec;

test('array', async () => {
  const codec = new Codec({
    element: {type: 'uint8'},
  });
  const value = [1, 2, 3, 4];
  const view = new DataView(new ArrayBuffer(codec.size(value)));
  const written = codec.encode(value, view);
  expect(codec.decode(view)).to.deep.equal({read: written, value});
});
