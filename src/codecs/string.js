class StringCodec {

  static decoder = new TextDecoder();
  static encoder = new TextEncoder();

  decode(view, target = {byteOffset: 0}) {
    const length = view.getUint32(target.byteOffset);
    target.byteOffset += 4;
    if (0 === length) {
      return '';
    }
    const stringView = new DataView(view.buffer, view.byteOffset + target.byteOffset, length);
    target.byteOffset += length;
    return this.constructor.decoder.decode(stringView);
  }

  encode(value, view, byteOffset = 0) {
    const {written} = this.constructor.encoder.encodeInto(
      value,
      new Uint8Array(view.buffer, view.byteOffset + byteOffset + 4),
    );
    view.setUint32(byteOffset, written);
    return 4 + written;
  }

  size(value) {
    return 4 + (this.constructor.encoder.encode(value)).length;
  }

}

export default StringCodec;
