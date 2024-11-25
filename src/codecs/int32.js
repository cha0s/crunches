class Int32Codec {
  decode(view, target) {
    const value = view.getInt32(target.byteOffset);
    target.byteOffset += 4;
    return value;
  }
  encode(value, view, byteOffset) {
    view.setInt32(byteOffset, value);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Int32Codec;
