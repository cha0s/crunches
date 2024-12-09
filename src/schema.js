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

  decode(bufferOrView, target = {byteOffset: 0}) {
    const view = ArrayBuffer.isView(bufferOrView) ? bufferOrView : new DataView(bufferOrView);
    return this.$$codec.decode(view, target);
  }

  encode(value) {
    const view = this.allocate(value);
    this.encodeInto(value, view, 0);
    return view;
  }

  encodeInto(value, view, byteOffset = 0) {
    return this.$$codec.encode(value, view, byteOffset);
  }

  size(value, offset = 0) {
    return this.$$codec.size(value, offset);
  }

}

export default Schema;
