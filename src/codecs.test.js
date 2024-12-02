import {expect, test} from 'vitest';

import BoolCodec from './codecs/bool.js';
import {Aliases, Codecs, resolveCodec} from './codecs.js';

Codecs.bool = BoolCodec;

test('resolve', async () => {
  expect(resolveCodec({type: 'bool'})).toBeInstanceOf(BoolCodec);
});

test('aliases', async () => {
  expect(resolveCodec({type: 'boolean'})).toBeInstanceOf(BoolCodec);
  Aliases.booboo = 'boolean';
  expect(resolveCodec({type: 'booboo'})).toBeInstanceOf(BoolCodec);
});

test('alias cycle', async () => {
  expect(resolveCodec({type: 'boolean'})).toBeInstanceOf(BoolCodec);
  Aliases.foofoo = 'bar';
  Aliases.bar = 'foofoo';
  expect(() => resolveCodec({type: 'foofoo'})).toThrowError();
});

test('no blueprint', async () => {
  expect(() => resolveCodec()).toThrowError();
});

test('suggestion', async () => {
  expect(() => resolveCodec('bool')).toThrowError(
    "Blueprint 'bool' looks like a type. Try {type: 'bool'}",
  );
});
