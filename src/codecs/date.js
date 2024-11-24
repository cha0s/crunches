import StringCodec from './string.js';

// will coerce strings to `Date`s
class DateCodec extends StringCodec {

  decode(view, byteOffset = 0) {
    const decoded = super.decode(view, byteOffset);
    return {read: decoded.read, value: new Date(decoded.value)};
  }

  encode(value, view, byteOffset = 0) {
    return super.encode(new Date(value).toISOString(), view, byteOffset);
  }

  size(value) {
    return super.size(new Date(value).toISOString());
  }

}

export default DateCodec;
