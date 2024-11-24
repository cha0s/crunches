
class Uint32Codec {
  decode(view, byteOffset = 0) {
    return {read: 4, value: view.getUint32(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setUint32(byteOffset, value);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Uint32Codec;
