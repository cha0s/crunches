import {Codecs} from '../codecs.js';

export function typeToElementClass(type) {
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

export function paddingForType(type) {
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
    const {length = 0} = blueprint;
    const {type} = blueprint.element;
    const ElementClass = typeToElementClass(type);
    let decoderCode = '', encoderCode = '';
    // varlen
    if (0 === length) {
      decoderCode += `
        const length = view.getUint32(target.byteOffset);
        target.byteOffset += 4 + ${paddingForType(type)};
      `;
      encoderCode += `
        let length = 0;
        let written = 4 + ${paddingForType(type)};
      `;
      if (ElementClass) {
        encoderCode += `
          if (Array.isArray(value)) {
            length = value.length;
            new ElementClass(
              view.buffer,
              view.byteOffset + byteOffset + written
            ).set(new ElementClass(value));
            written += ElementClass.BYTES_PER_ELEMENT * length;
          }
          else {
        `;
      }
      encoderCode += `
        for (const element of value) {
          length += 1;
          written += this.$$elementCodec.encode(element, view, byteOffset + written);
        }
      `;
      if (ElementClass) {
        encoderCode += '}';
      }
      encoderCode += `
        view.setUint32(byteOffset, length);
        return written;
      `;
      if (ElementClass) {
        this.$$size = (value) => {
          let size = 4 + paddingForType(type);
          if (Array.isArray(value)) {
            return size + value.length * ElementClass.BYTES_PER_ELEMENT;
          }
          if (value instanceof Set) {
            return size + value.size * ElementClass.BYTES_PER_ELEMENT;
          }
          for (const element of value) {
            size += this.$$elementCodec.size(element);
          }
          return size;
        };
      }
      else {
        this.$$size = (value) => {
          let size = 4 + paddingForType(type);
          for (const element of value) {
            size += this.$$elementCodec.size(element);
          }
          return size;
        };
      }
    }
    // fixed
    else {
      decoderCode += `const length = ${length};`;
      encoderCode += 'let written = 0;';
      if (ElementClass) {
        encoderCode += `
          if (Array.isArray(value)) {
            new ElementClass(
              view.buffer,
              view.byteOffset + byteOffset + written
            ).set(new ElementClass(value));
            written += ElementClass.BYTES_PER_ELEMENT * ${length};
          }
          else {
        `;
      }
      encoderCode += `
        // let the environment report
        if (!value[Symbol.iterator]) {
          for (const _ of value) {/* ... */} // eslint-disable-line no-unused-vars
        }
        let protocol = value[Symbol.iterator]();
        let result = protocol.next();
        for (let i = 0; !result.done && i < ${length}; ++i) {
          written += this.$$elementCodec.encode(result.value, view, byteOffset + written);
          result = protocol.next();
        }
      `;
      if (ElementClass) {
        encoderCode += '}';
      }
      encoderCode += 'return written;';
      if (ElementClass) {
        this.$$size = () => {
          return length * ElementClass.BYTES_PER_ELEMENT;
        };
      }
      else {
        this.$$size = (value) => {
          let size = 0;
          // let the environment report
          if (!value[Symbol.iterator]) {
            for (const _ of value) {/* ... */} // eslint-disable-line no-unused-vars
          }
          let protocol = value[Symbol.iterator]();
          let result = protocol.next();
          for (let i = 0; !result.done && i < length; ++i) {
            size += this.$$elementCodec.size(result.value);
            result = protocol.next();
          }
          return size;
        };
      }
    }
    // static shape
    if (ElementClass) {
      decoderCode += `
        const value = new ElementClass(view.buffer, view.byteOffset + target.byteOffset, length);
        target.byteOffset += ${ElementClass.BYTES_PER_ELEMENT} * length;
      `;
    }
    // dynamic shape
    else {
      decoderCode += `
        const value = Array(length);
        for (let i = 0; i < length; ++i) {
          value[i] = this.$$elementCodec.decode(view, target);
        }
      `;
    }
    decoderCode += 'return value;';
    const decoder = new Function('ElementClass, view, target', decoderCode);
    this.$$decode = decoder.bind(this, ElementClass);
    const encoder = new Function('ElementClass, value, view, byteOffset', encoderCode);
    this.$$encode = encoder.bind(this, ElementClass);
  }

  decode(view, target) {
    return this.$$decode(view, target);
  }

  encode(value, view, byteOffset) {
    return this.$$encode(value, view, byteOffset);
  }

  size(value) {
    return this.$$size(value);
  }

}

export default ArrayCodec;
