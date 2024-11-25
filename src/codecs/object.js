import {Codecs} from '../codecs.js';

class ObjectCodec {

  $$booleans = 0;
  $$codecs = [];
  $$optionals = 0;

  constructor(blueprint) {
    let encoderCode = '';
    let decoderCode = `
      const value = {};
    `;
    let i = 0;
    for (const key in blueprint.properties) {
      const property = blueprint.properties[key];
      if (!(property.type in Codecs)) {
        throw new TypeError(`No such codec '${property.type}'`);
      }
      const codec = new Codecs[property.type](property);
      if (property.optional) {
        this.$$optionals += 1;
        decoderCode += `
          index = currentOptional >> 3;
          bit = currentOptional & 7;
          currentOptional += 1;
          if (!(optionalFlags[index] & (1 << bit))) {
            ${
              'bool' === property.type
              ? '$$booleans -= 1'
              : ''
            }
          }
          else {
        `;
        encoderCode += `
          index = currentOptional >> 3;
          bit = currentOptional & 7;
          isPresent = 'undefined' !== typeof value['${key}'];
          optionalFlags[index] |= (isPresent ? 1 : 0) << bit;
          currentOptional += 1;
          if (isPresent) {
        `;
      }
      if ('bool' === property.type) {
        this.$$booleans += 1;
        decoderCode += `
          index = currentBoolean >> 3;
          bit = currentBoolean & 7;
          currentBoolean += 1;
          booleanBackpatches.push({bit, index, key: '${key}'});
        `;
        encoderCode += `
          index = currentBoolean >> 3;
          bit = currentBoolean & 7;
          booleanFlags[index] |= (value['${key}'] ? 1 : 0) << bit;
          currentBoolean += 1;
        `;
      }
      else {
        decoderCode += `value['${key}'] = this.$$codecs[${i}].codec.decode(view, target);`;
        encoderCode += `written += this.$$codecs[${i}].codec.encode(value['${key}'], view, byteOffset + written);`;
      }
      if (property.optional) {
        decoderCode += '}';
        encoderCode += '}';
      }
      this.$$codecs.push({codec, key, property});
      this.$$flatCodecs
      i += 1;
    }
    if (this.$$booleans > 0) {
      decoderCode = `
        let currentBoolean = 0;
        let {$$booleans} = this;
        const booleanBackpatches = [];
      ` + decoderCode;
      decoderCode += `
        const booleanFlags = [];
        const booleanCount = Math.ceil($$booleans / 8);
        if (booleanCount > 0) {
          for (let i = 0; i < booleanCount; ++i) {
            booleanFlags.push(view.getUint8(target.byteOffset));
            target.byteOffset += 1;
          }
          for (const {bit, index, key} of booleanBackpatches) {
            value[key] = !!(booleanFlags[index] & (1 << bit));
          }
        }
      `;
      encoderCode += `
        for (let i = 0; i < booleanFlags.length; ++i) {
          view.setUint8(byteOffset + written + i, booleanFlags[i]);
        }
        written += booleanFlags.length;
      `;
      encoderCode = `
        const booleanFlags = [];
        let currentBoolean = 0;
      ` + encoderCode;
    }
    if (this.$$optionals > 0) {
      decoderCode = `
        const optionalFlags = [];
        let currentOptional = 0;
        const optionalCount = Math.ceil(this.$$optionals / 8);
        for (let i = 0; i < optionalCount; ++i) {
          optionalFlags.push(view.getUint8(target.byteOffset));
          target.byteOffset += 1;
        }
      ` + decoderCode;
      encoderCode += `
        for (let i = 0; i < optionalFlags.length; ++i) {
          view.setUint8(byteOffset + i, optionalFlags[i]);
        }
      `;
      encoderCode = `
        const optionalFlags = [];
        let currentOptional = 0;
        let isPresent;
        written += Math.ceil(this.$$optionals / 8);
      ` + encoderCode
    }
    if (this.$$optionals > 0 || this.$$booleans > 0) {
      decoderCode = `
        let bit, index;
      ` + decoderCode;
      encoderCode = `
        let bit, index;
      ` + encoderCode;
    }
    encoderCode = `
      let written = 0;
    ` + encoderCode;
    encoderCode += `
      return written;
    `;
    decoderCode += 'return value';
    this.decode = new Function('view, target', decoderCode);
    this.encode = new Function('value, view, byteOffset', encoderCode);
  }

  size(value) {
    let {$$booleans} = this;
    let size = 0;
    size += Math.ceil(this.$$optionals / 8);
    for (const {codec, key, property} of this.$$codecs) {
      if (property.optional && 'undefined' === typeof value[key]) {
        if ('bool' === property.type) {
          $$booleans -= 1;
        }
        continue;
      }
      if ('bool' !== property.type) {
        size += codec.size(value[key]);
      }
    }
    size += Math.ceil($$booleans / 8);
    return size;
  }

}

export default ObjectCodec;
