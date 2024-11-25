class Float64Codec {
  decode(view, target) {
    const value = view.getFloat64(target.byteOffset);
    target.byteOffset += 8;
    return value;
  }
  encode(value, view, byteOffset = 0) {
    view.setFloat64(byteOffset, value);
    return 8;
  }
  size() {
    return 8;
  }
}

export default Float64Codec;
