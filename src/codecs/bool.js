class BoolCodec {
  decode(view, target) {
    const value = !!view.getUint8(target.byteOffset);
    target.byteOffset += 1;
    return value;
  }
  encode(value, view, byteOffset) {
    view.setUint8(byteOffset, !!value);
    return 1;
  }
  size() {
    return 1;
  }
}

export default BoolCodec;
