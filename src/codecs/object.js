import {resolveCodec} from '../codecs.js';
import BoolCodec from './bool.js';

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
      const codec = resolveCodec(property);
      if (property.optional) {
        this.$$optionals += 1;
        decoderCode += `
          if (!(optionalFlags[currentOptional >> 3] & (1 << (currentOptional & 7)))) {
            ${(codec instanceof BoolCodec) ? '$$booleans -= 1' : ''}
          }
          else {
        `;
        encoderCode += `
          isPresent = 'undefined' !== typeof value['${key}'];
          optionalFlags[currentOptional >> 3] |= (isPresent ? 1 : 0) << (currentOptional & 7);
          currentOptional += 1;
          if (isPresent) {
        `;
      }
      if (codec instanceof BoolCodec) {
        this.$$booleans += 1;
        decoderCode += `
          booleanBackpatches.push({bit: currentBoolean & 7, index: currentBoolean >> 3, key: '${key}'});
          currentBoolean += 1;
        `;
        encoderCode += `
          booleanFlags[currentBoolean >> 3] |= (value['${key}'] ? 1 : 0) << (currentBoolean & 7);
          currentBoolean += 1;
        `;
      }
      else {
        decoderCode += `value['${key}'] = this.$$codecs[${i}].decode(view, target);`;
        encoderCode += `written += this.$$codecs[${i}].encode(value['${key}'], view, byteOffset + written);`;
      }
      if (property.optional) {
        decoderCode += `
          }
          currentOptional += 1;
        `;
        encoderCode += '}';
      }
      this.$$codecs.push(codec);
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
    encoderCode = `
      let written = 0;
    ` + encoderCode;
    encoderCode += `
      return written;
    `;
    decoderCode += 'return value';
    this.$$decode = new Function('view, target', decoderCode);
    this.$$encode = new Function('value, view, byteOffset', encoderCode);
    this.$$size = (value) => {
      let {$$booleans} = this;
      let size = 0;
      size += Math.ceil(this.$$optionals / 8);
      let i = 0;
      for (const key in blueprint.properties) {
        const codec = this.$$codecs[i];
        const property = blueprint.properties[key];
        if (property.optional && 'undefined' === typeof value[key]) {
          if (codec instanceof BoolCodec) {
            $$booleans -= 1;
          }
          i += 1;
          continue;
        }
        if (!(codec instanceof BoolCodec)) {
          size += codec.size(value[key]);
        }
        i += 1;
      }
      size += Math.ceil($$booleans / 8);
      return size;
    };
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

export default ObjectCodec;
