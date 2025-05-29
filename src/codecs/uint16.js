class Uint16Codec {
  decode(view, target) {
    const value = view.getUint16(target.byteOffset, target.isLittleEndian);
    target.byteOffset += 2;
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    view.setUint16(byteOffset, value, isLittleEndian);
    return 2;
  }
  size() {
    return 2;
  }
}

export default Uint16Codec;
