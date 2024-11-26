import {Codecs} from '../codecs.js';

function typeToElementClass(type) {
  switch (type) {
    case 'int8': return Int8Array;
    case 'uint8': return Uint8Array;
    case 'int16': return Int16Array;
    case 'uint16': return Uint16Array;
    case 'int32': return Int32Array;
    case 'uint32': return Uint32Array;
    case 'float32': return Float32Array;
    case 'float64': return Float64Array;
  }
  return undefined;
}

function paddingForType(type) {
  let padding = 0;
  switch (type) {
    case 'float64': padding = 4; break;
  }
  return padding;
}

class ArrayCodec {

  $$elementCodec;

  constructor(blueprint) {
    if (!(blueprint.element.type in Codecs)) {
      throw new TypeError(`No such codec '${blueprint.element.type}'`);
    }
    // todo: throw on optional or honor and encode sparse arrays
    // todo: boolean coalescence
    this.$$elementCodec = new Codecs[blueprint.element.type](blueprint.element);
    this.$$type = blueprint.element.type;
  }

  decode(view, target) {
    const length = view.getUint32(target.byteOffset);
    target.byteOffset += 4;
    let ElementClass = typeToElementClass(this.$$type);
    if (ElementClass) {
      const value = new ElementClass(
        view.buffer,
        view.byteOffset + target.byteOffset + paddingForType(this.$$type),
        length,
      );
      target.byteOffset += length;
      return value;
    }
    const value = Array(length);
    for (let i = 0; i < length; ++i) {
      value[i] = this.$$elementCodec.decode(view, target);
    }
    return value;
  }

  encode(value, view, byteOffset) {
    let length = 0;
    let written = 4;
    let ElementClass = typeToElementClass(this.$$type);
    if (ElementClass && Array.isArray(value)) {
      length = value.length;
      new ElementClass(
        view.buffer,
        view.byteOffset + byteOffset + written + paddingForType(this.$$type)
      ).set(new ElementClass(value));
      written += ElementClass.BYTES_PER_ELEMENT * length;
    }
    else {
      for (const element of value) {
        length += 1;
        written += this.$$elementCodec.encode(element, view, byteOffset + written);
      }
    }
    view.setUint32(byteOffset, length);
    return written;
  }

  size(value) {
    let size = 4;
    let ElementClass = typeToElementClass(this.$$type);
    if (ElementClass) {
      if (Array.isArray(value)) {
        return size + paddingForType(this.$$type) + value.length * ElementClass.BYTES_PER_ELEMENT;
      }
      if (value instanceof Set) {
        return size + paddingForType(this.$$type) + value.size * ElementClass.BYTES_PER_ELEMENT;
      }
    }
    for (const element of value) {
      size += this.$$elementCodec.size(element);
    }
    return size;
  }

}

export default ArrayCodec;
