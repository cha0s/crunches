class Int8Codec {
  decode(view, target = {byteOffset: 0}) {
    const value = view.getInt8(target.byteOffset);
    target.byteOffset += 1;
    return value;
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
