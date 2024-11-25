class Uint8Codec {
  decode(view, target = {byteOffset: 0}) {
    const value = view.getUint8(target.byteOffset);
    target.byteOffset += 1;
    return value;
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
