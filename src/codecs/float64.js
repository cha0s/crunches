class Float64Codec {
  decode(view, byteOffset = 0) {
    return {read: 8, value: view.getFloat64(byteOffset)};
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
