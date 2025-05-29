import StringCodec from './string.js';

// will coerce strings to `Date`s
class DateCodec extends StringCodec {

  decode(view, target) {
    return new Date(super.decode(view, target));
  }

  encode(value, view, byteOffset, isLittleEndian) {
    return super.encode(new Date(value).toISOString(), view, byteOffset, isLittleEndian);
  }

  size(value) {
    return super.size(new Date(value).toISOString());
  }

}

export default DateCodec;
