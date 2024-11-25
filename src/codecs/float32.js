class Float32Codec {
  decode(view, target) {
    const value = view.getFloat32(target.byteOffset);
    target.byteOffset += 4;
    return value;
  }
  encode(value, view, byteOffset) {
    view.setFloat32(byteOffset, value);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Float32Codec;
