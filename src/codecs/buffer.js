class BufferCodec {

  decode(view, target) {
    const length = view.getUint32(target.byteOffset);
    target.byteOffset += 4;
    const value = new ArrayBuffer(length);
    if (0 === length) {
      return value;
    }
    new Uint8Array(value).set(new Uint8Array(view.buffer, view.byteOffset + target.byteOffset));
    target.byteOffset += length;
    return value;
  }

  encode(value, view, byteOffset) {
    view.setUint32(byteOffset, value.byteLength);
    new Uint8Array(view.buffer, view.byteOffset).set(new Uint8Array(value), byteOffset + 4);
    return 4 + value.byteLength;
  }

  size(value) {
    return 4 + value.byteLength;
  }

}

export default BufferCodec;
