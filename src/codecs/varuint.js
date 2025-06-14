const stride = Math.pow(2, 7);

class VarUintCodec {
  decode(view, target) {
    let byte;
    let read = 1;
    let value = 0;
    do {
      byte = view.getUint8(target.byteOffset, target.isLittleEndian);
      target.byteOffset += 1;
      value += (byte & 127) * read;
      read *= stride;
    } while (byte & 128);
    return value;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    let written = 0;
    while (value > 127) {
      view.setUint8(byteOffset + written, (value % 128) + 128, isLittleEndian);
      written += 1;
      value = Math.floor(value / 128);
    }
    view.setUint8(byteOffset + written, value % 128, isLittleEndian);
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
