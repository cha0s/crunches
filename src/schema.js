import {resolveCodec} from './codecs.js';

// Just an ergonomic wrapper around the root codec.
class Schema {

  $$codec;

  constructor(blueprint) {
    this.$$codec = resolveCodec(blueprint);
  }

  allocate(value) {
    return new DataView(new ArrayBuffer(this.size(value)));
  }

  decode(view, target = {byteOffset: 0}) {
    return this.$$codec.decode(view, target);
  }

  encode(value, view, byteOffset = 0) {
    return this.$$codec.encode(value, view, byteOffset);
  }

  size(value) {
    return this.$$codec.size(value, 0);
  }

}

export default Schema;
