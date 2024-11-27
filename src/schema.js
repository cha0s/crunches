import {resolveCodec} from './codecs.js';

// Just an ergonomic wrapper around the root codec.
class Schema {

  $$codec;

  constructor(blueprint) {
    this.$$codec = resolveCodec(blueprint);
  }

  decode(view, target = {byteOffset: 0}) {
    return this.$$codec.decode(view, target);
  }

  encode(value, view, byteOffset = 0) {
    return this.$$codec.encode(value, view, byteOffset);
  }

  size(value) {
    return this.$$codec.size(value);
  }

}

export default Schema;
