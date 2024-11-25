class BufferCodec {

  decode(view, byteOffset = 0) {
    const length = view.getUint32(byteOffset);
    const value = new ArrayBuffer(length);
    if (0 === length) {
      return {read: 4, value};
    }
    new Uint8Array(value).set(new Uint8Array(view.buffer, 4 + view.byteOffset + byteOffset));
    return {read: 4 + length, value};
  }

  encode(value, view, byteOffset = 0) {
    view.setUint32(byteOffset, value.byteLength);
    new Uint8Array(view.buffer, view.byteOffset).set(new Uint8Array(value), byteOffset + 4);
    return 4 + value.byteLength;
  }

  size(value) {
    return 4 + value.byteLength;
  }

}

export default BufferCodec;
