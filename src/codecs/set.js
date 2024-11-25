import ArrayCodec from './array.js';

class SetCodec extends ArrayCodec {

  constructor(blueprint) {
    super({
      element: blueprint.element,
      type: 'array',
    });
  }

  decode(view, target = {byteOffset: 0}) {
    return new Set(super.decode(view, target));
  }

}

export default SetCodec;
