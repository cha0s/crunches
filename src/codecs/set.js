import ArrayCodec from './array.js';

class SetCodec extends ArrayCodec {

  constructor(blueprint) {
    super({
      element: blueprint.element,
      type: 'array',
    });
  }

  decode(view, byteOffset = 0) {
    const decoded = super.decode(view, byteOffset);
    return {read: decoded.read, value: new Set(decoded.value)};
  }

}

export default SetCodec;
