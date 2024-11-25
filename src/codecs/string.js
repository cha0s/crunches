class StringCodec {

  static decoder = new TextDecoder();
  static encoder = new TextEncoder();

  decode(view, byteOffset = 0) {
    const length = view.getUint32(byteOffset);
    if (0 === length) {
      return {read: 4, value: ''};
    }
    const stringView = new DataView(view.buffer, view.byteOffset + byteOffset + 4, length);
    const value = this.constructor.decoder.decode(stringView);
    return {read: 4 + length, value};
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
