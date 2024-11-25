class VarUintCodec {
  decode(view, byteOffset = 0) {
    let byte;
    let read = 0;
    let value = 0;
    do {
      byte = view.getUint8(byteOffset + read);
      value += (byte & 127) * Math.pow(2, read * 7);
      read += 1;
    } while (byte & 128);
    return {read, value};
  }
  encode(value, view, byteOffset = 0) {
    let written = 0;
    while (value > 127) {
      view.setUint8(byteOffset + written, (value % 128) + 128);
      written += 1;
      value = Math.floor(value / 128);
    }
    view.setUint8(byteOffset + written, value % 128);
    return written + 1;
  }
  size(value) {
    let size = 1;
    while (value > 127) {
      size += 1;
      value = Math.floor(value / 128);
    }
    return size;
  }
}

export default VarUintCodec;
