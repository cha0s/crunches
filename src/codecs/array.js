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

  decode(view, target) {
    const length = view.getUint32(target.byteOffset);
    target.byteOffset += 4;
    const value = Array(length);
    for (let i = 0; i < length; ++i) {
      value[i] = this.$$elementCodec.decode(view, target);
    }
    return value;
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
