import ArrayCodec from './array.js';

class SetCodec extends ArrayCodec {

  constructor(blueprint) {
    super({
      element: blueprint.element,
      type: 'array',
    });
  }

  decode(view, target) {
    return new Set(super.decode(view, target));
  }

}

export default SetCodec;
