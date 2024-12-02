import {resolveCodec} from '../codecs.js';

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
    case 'bigint64': return BigInt64Array;
    case 'biguint64': return BigUint64Array;
  }
  return undefined;
}

export function paddingForType(type, byteOffset) {
  let width = 0;
  switch (type) {
    case 'int16':
    case 'uint16': {
      width = 2;
      break;
    }
    case 'float32':
    case 'int32':
    case 'uint32': {
      width = 4;
      break;
    }
    case 'float64': {
      width = 8;
      break;
    }
    default: return 0;
  }
  const extra = byteOffset & (width - 1);
  if (0 === extra) {
    return 0;
  }
  return width - extra;
}

class ArrayCodec {

  $$elementCodec;

  constructor(blueprint) {
    this.$$elementCodec = resolveCodec(blueprint.element);
    this.$$paddingForType = paddingForType;
    const {length = 0} = blueprint;
    const {type} = blueprint.element;
    const ElementClass = typeToElementClass(type);
    let decoderCode = '', encoderCode = '';
    // varlen
    if (0 === length) {
      decoderCode += `
        const length = view.getUint32(target.byteOffset);
        target.byteOffset += 4;
        target.byteOffset += this.$$paddingForType('${type}', target.byteOffset);
      `;
      encoderCode += `
        let length = 0;
        let written = 4 + this.$$paddingForType('${type}', byteOffset + 4);
      `;
      if (ElementClass) {
        encoderCode += `
          if (Array.isArray(value)) {
            length = value.length;
            new ElementClass(
              view.buffer,
              view.byteOffset + byteOffset + written,
              length,
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
        this.$$size = (value, byteOffset) => {
          let size = 4 + paddingForType(type, byteOffset + 4);
          if (Array.isArray(value)) {
            return size + value.length * ElementClass.BYTES_PER_ELEMENT;
          }
          if (value instanceof Set) {
            return size + value.size * ElementClass.BYTES_PER_ELEMENT;
          }
          for (const element of value) {
            size += this.$$elementCodec.size(element, byteOffset + size);
          }
          return size;
        };
      }
      else {
        this.$$size = (value) => {
          let size = 4;
          for (const element of value) {
            size += this.$$elementCodec.size(element, size);
          }
          return size;
        };
      }
    }
    // fixed
    else {
      decoderCode += `const length = ${length};`;
      encoderCode += `let written = 0`;
      if (ElementClass) {
        encoderCode += `
          if (Array.isArray(value)) {
            written += this.$$paddingForType('${type}', byteOffset);
            new ElementClass(
              view.buffer,
              view.byteOffset + byteOffset + written,
              ${length},
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
        for (let i = 0; i < ${length}; ++i) {
          written += this.$$elementCodec.encode(result.value, view, byteOffset + written);
          result = protocol.next();
        }
      `;
      if (ElementClass) {
        encoderCode += '}';
      }
      encoderCode += 'return written;';
      if (ElementClass) {
        this.$$size = (value, byteOffset) => {
          return paddingForType(type, byteOffset) + length * ElementClass.BYTES_PER_ELEMENT;
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
          for (let i = 0; i < length; ++i) {
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
        target.byteOffset += this.$$paddingForType('${type}', target.byteOffset);
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

  size(value, byteOffset) {
    return this.$$size(value, byteOffset);
  }

}

export default ArrayCodec;
