import {Codecs} from './codecs.js';

// Just an ergonomic wrapper around the root codec.
class Schema {

  $$codec;

  constructor(blueprint) {
    if (!(blueprint.type in Codecs)) {
      throw new TypeError(`No such codec '${blueprint.type}'`);
    }
    this.$$codec = new Codecs[blueprint.type](blueprint);
  }

  decode(view, byteOffset = 0) {
    return this.$$codec.decode(view, byteOffset);
  }

  encode(value, view, byteOffset = 0) {
    return this.$$codec.encode(value, view, byteOffset);
  }

  size(value) {
    return this.$$codec.size(value);
  }

}

export default Schema;
