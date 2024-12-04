import {Aliases, Codecs, resolveCodec} from './codecs.js';
import Schema from './schema.js';

const codecs = import.meta.glob(
  ['./codecs/*.js', '!./codecs/*.test.js'],
  {eager: true, import: 'default'},
);
for (const path in codecs) {
  const key = path.split('/').pop().split('.').shift();
  Codecs[key] = codecs[path];
}

export {Aliases, Codecs, resolveCodec, Schema};
