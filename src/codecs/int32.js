class Int32Codec {
  decode(view, byteOffset = 0) {
    return {read: 4, value: view.getInt32(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setInt32(byteOffset, value);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Int32Codec;
