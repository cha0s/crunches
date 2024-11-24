
class Float32Codec {
  decode(view, byteOffset = 0) {
    return {read: 4, value: view.getFloat32(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setFloat32(byteOffset, value);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Float32Codec;
