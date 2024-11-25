import VarUintCodec from './varuint.js';

class VarIntCodec extends VarUintCodec {
  decode(view, byteOffset = 0) {
    const decoded = super.decode(view, byteOffset);
    const half = Math.floor(decoded.value / 2);
    return {read: decoded.read, value: decoded.value & 1 ? -half - 1 : half};
  }
  encode(value, view, byteOffset = 0) {
    value *= 2;
    return super.encode(value < 0 ? -value - 1 : value, view, byteOffset);
  }
  size(value) {
    value *= 2;
    return super.size(value < 0 ? -value - 1 : value);
  }
}

export default VarIntCodec;
