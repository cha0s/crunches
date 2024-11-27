class Uint64Codec {
  decode(view, target) {
    const value = view.getBigUint64(target.byteOffset);
    target.byteOffset += 8;
    return value;
  }
  encode(value, view, byteOffset) {
    view.setBigUint64(byteOffset, value);
    return 8;
  }
  size() {
    return 8;
  }
}

export default Uint64Codec;
