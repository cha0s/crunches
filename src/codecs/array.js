import {Codecs} from '../codecs.js';

class ArrayCodec {

  $$elementCodec;

  constructor(blueprint) {
    if (!(blueprint.element.type in Codecs)) {
      throw new TypeError(`No such codec '${blueprint.element.type}'`);
    }
    // todo: throw on optional or honor and encode sparse arrays
    // todo: boolean coalescence
    this.$$elementCodec = new Codecs[blueprint.element.type](blueprint.element);
  }

  decode(view, byteOffset = 0) {
    let read = 0;
    const length = view.getUint32(byteOffset);
    read += 4;
    const value = Array(length);
    for (let i = 0; i < length; ++i) {
      const decoded = this.$$elementCodec.decode(view, byteOffset + read);
      value[i] = decoded.value;
      read += decoded.read;
    }
    return {read, value};
  }

  encode(value, view, byteOffset = 0) {
    let length = 0;
    let written = 4;
    for (const element of value) {
      length += 1;
      written += this.$$elementCodec.encode(element, view, byteOffset + written);
    }
    view.setUint32(byteOffset, length);
    return written;
  }

  size(value) {
    let size = 4;
    for (const element of value) {
      size += this.$$elementCodec.size(element);
    }
    return size;
  }

}

export default ArrayCodec;
