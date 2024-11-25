class Uint32Codec {
  decode(view, target = {byteOffset: 0}) {
    const value = view.getUint32(target.byteOffset);
    target.byteOffset += 4;
    return value;
  }
  encode(value, view, byteOffset = 0) {
    view.setUint32(byteOffset, value);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Uint32Codec;
