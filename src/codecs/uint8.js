class Uint8Codec {
  decode(view, byteOffset = 0) {
    return {read: 1, value: view.getUint8(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setUint8(byteOffset, value);
    return 1;
  }
  size() {
    return 1;
  }
}

export default Uint8Codec;
