import ArrayCodec from './array.js';

class MapCodec extends ArrayCodec {

  constructor(blueprint) {
    super({
      type: 'array',
      element: {
        properties: {
          key: blueprint.key,
          value: blueprint.value,
        },
        type: 'object',
      },
    });
  }

  decode(view, target) {
    const value = new Map();
    for (const {key, value: mapValue} of super.decode(view, target)) {
      value.set(key, mapValue);
    }
    return value;
  }

  encode(value, view, byteOffset = 0) {
    const entries = [];
    for (const [key, mapValue] of value) {
      entries.push({key, value: mapValue});
    }
    return super.encode(entries, view, byteOffset);
  }

  size(value) {
    const entries = [];
    for (const [key, mapValue] of value) {
      entries.push({key, value: mapValue});
    }
    return super.size(entries);
  }

}

export default MapCodec;
