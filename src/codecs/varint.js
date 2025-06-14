import VarUintCodec from './varuint.js';

class VarIntCodec extends VarUintCodec {
  decode(view, target) {
    const varuint = super.decode(view, target);
    const half = Math.floor(varuint / 2);
    return varuint & 1 ? -half - 1 : half;
  }
  encode(value, view, byteOffset, isLittleEndian) {
    value *= 2;
    return super.encode(value < 0 ? -value - 1 : value, view, byteOffset, isLittleEndian);
  }
  size(value) {
    value *= 2;
    return super.size(value < 0 ? -value - 1 : value);
  }
}

export default VarIntCodec;
