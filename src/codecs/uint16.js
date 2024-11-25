class Uint16Codec {
  decode(view, target) {
    const value = view.getUint16(target.byteOffset);
    target.byteOffset += 2;
    return value;
  }
  encode(value, view, byteOffset = 0) {
    view.setUint16(byteOffset, value);
    return 2;
  }
  size() {
    return 2;
  }
}

export default Uint16Codec;
