class Int8Codec {
  decode(view, target) {
    const value = view.getInt8(target.byteOffset, target.isLittleEndian);
    target.byteOffset += 1;
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    view.setInt8(byteOffset, value, isLittleEndian);
    return 1;
  }
  size() {
    return 1;
  }
}

export default Int8Codec;
