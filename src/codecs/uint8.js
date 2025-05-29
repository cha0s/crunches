class Uint8Codec {
  decode(view, target) {
    const value = view.getUint8(target.byteOffset, target.isLittleEndian);
    target.byteOffset += 1;
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    view.setUint8(byteOffset, value, isLittleEndian);
    return 1;
  }
  size() {
    return 1;
  }
}

export default Uint8Codec;
