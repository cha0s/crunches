class Float64Codec {
  decode(view, target) {
    const value = view.getFloat64(target.byteOffset, target.isLittleEndian);
    target.byteOffset += 8;
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    view.setFloat64(byteOffset, value, isLittleEndian);
    return 8;
  }
  size() {
    return 8;
  }
}

export default Float64Codec;
