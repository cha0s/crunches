class Int16Codec {
  decode(view, target = {byteOffset: 0}) {
    const value = view.getInt16(target.byteOffset);
    target.byteOffset += 2;
    return value;
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
