import Uint32Codec from './uint32.js';
import VarUintCodec from './varuint.js';

class StringCodec {

  static decoder = new TextDecoder();
  static encoder = new TextEncoder();

  constructor(blueprint = {varuint: false}) {
    this.$$prefix = blueprint.varuint ? new VarUintCodec() : new Uint32Codec();
  }

  decode(view, target) {
    const length = this.$$prefix.decode(view, target);
    if (0 === length) {
      return '';
    }
    const stringView = new Uint8Array(view.buffer, view.byteOffset + target.byteOffset, length);
    target.byteOffset += length;
    return this.constructor.decoder.decode(stringView);
  }

  encode(value, view, byteOffset) {
    const prefixLength = this.$$prefix.size(value.length * 3);
    const {written} = this.constructor.encoder.encodeInto(
      value,
      new Uint8Array(view.buffer, view.byteOffset + byteOffset + prefixLength),
    );
    this.$$prefix.encode(written, view, byteOffset);
    return prefixLength + written;
  }

  size(value) {
    return 4 + (this.constructor.encoder.encode(value)).length;
  }

}

export default StringCodec;
