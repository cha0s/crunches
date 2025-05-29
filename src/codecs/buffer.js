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

  encode(value, view, byteOffset, isLittleEndian) {
    const prefixLength = this.$$prefix.encode(value.byteLength, view, byteOffset, isLittleEndian);
    new Uint8Array(view.buffer, view.byteOffset)
      .set(new Uint8Array(value), byteOffset + prefixLength);
    return prefixLength + value.byteLength;
  }

  size(value) {
    return this.$$prefix.size(value.byteLength) + value.byteLength;
  }

}

export default BufferCodec;
