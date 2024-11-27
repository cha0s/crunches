class Int64Codec {
  decode(view, target) {
    const value = view.getBigInt64(target.byteOffset);
    target.byteOffset += 8;
    return value;
  }
  encode(value, view, byteOffset) {
    view.setBigInt64(byteOffset, value);
    return 8;
  }
  size() {
    return 8;
  }
}

export default Int64Codec;
