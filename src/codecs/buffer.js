import Uint32Codec from './uint32.js';
import VarUintCodec from './varuint.js';

class BufferCodec {

  constructor(blueprint = {varuint: false}) {
    this.$$prefix = blueprint.varuint ? new VarUintCodec() : new Uint32Codec();
  }

  decode(view, target) {
    const length = this.$$prefix.decode(view, target);
    const value = new DataView(view.buffer, view.byteOffset + target.byteOffset, length);
    target.byteOffset += length;
    return value;
  }

  encode(value, view, byteOffset) {
    const prefixLength = this.$$prefix.encode(value.byteLength, view, byteOffset);
    new Uint8Array(view.buffer, view.byteOffset)
      .set(new Uint8Array(value), byteOffset + prefixLength);
    return prefixLength + value.byteLength;
  }

  size(value) {
    const prefixLength = (this.$$prefix instanceof VarUintCodec)
      ? this.$$prefix.size(value.byteLength)
      : 4;
    return prefixLength + value.byteLength;
  }

}

export default BufferCodec;
