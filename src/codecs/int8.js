class Int8Codec {
  decode(view, byteOffset = 0) {
    return {read: 1, value: view.getInt8(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setInt8(byteOffset, value);
    return 1;
  }
  size() {
    return 1;
  }
}

export default Int8Codec;
