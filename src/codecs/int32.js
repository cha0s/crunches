class Int32Codec {
  decode(view, target) {
    const value = view.getInt32(target.byteOffset, target.isLittleEndian);
    target.byteOffset += 4;
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    view.setInt32(byteOffset, value, isLittleEndian);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Int32Codec;
