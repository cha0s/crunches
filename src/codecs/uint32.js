class Uint32Codec {
  decode(view, target) {
    const value = view.getUint32(target.byteOffset, target.isLittleEndian);
    target.byteOffset += 4;
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    view.setUint32(byteOffset, value, isLittleEndian);
    return 4;
  }
  size() {
    return 4;
  }
}

export default Uint32Codec;
