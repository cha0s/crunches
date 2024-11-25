class Int16Codec {
  decode(view, byteOffset = 0) {
    return {read: 2, value: view.getInt16(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setInt16(byteOffset, value);
    return 2;
  }
  size() {
    return 2;
  }
}

export default Int16Codec;
