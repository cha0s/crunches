
class Uint16Codec {
  decode(view, byteOffset = 0) {
    return {read: 2, value: view.getUint16(byteOffset)};
  }
  encode(value, view, byteOffset = 0) {
    view.setUint16(byteOffset, value);
    return 2;
  }
  size() {
    return 2;
  }
}

export default Uint16Codec;
