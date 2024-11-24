import {Codecs} from '../codecs.js';

class ObjectCodec {

  $$booleans = 0;
  $$codecs = [];
  $$optionals = 0;

  constructor(blueprint) {
    for (const key in blueprint.properties) {
      const property = blueprint.properties[key];
      if (!(property.type in Codecs)) {
        throw new TypeError(`No such codec '${property.type}'`);
      }
      if ('bool' === property.type) {
        this.$$booleans += 1;
      }
      const codec = new Codecs[property.type](property);
      if (property.optional) {
        this.$$optionals += 1;
      }
      this.$$codecs.push({codec, key, property});
    }
  }

  decode(view, byteOffset = 0) {
    const booleanFlags = [];
    const optionalFlags = [];
    let currentBoolean = 0;
    let currentOptional = 0;
    let read = 0;
    let {$$booleans} = this;
    const booleanBackpatches = [];
    const optionalCount = Math.ceil(this.$$optionals / 8);
    for (let i = 0; i < optionalCount; ++i) {
      optionalFlags.push(view.getUint8(byteOffset + i));
    }
    read += optionalCount;
    const value = {};
    for (const {codec, key, property} of this.$$codecs) {
      if (property.optional) {
        const index = Math.floor(currentOptional / 8);
        const bit = currentOptional % 8;
        currentOptional += 1;
        const isPresent = optionalFlags[index] & (1 << bit);
        if (!isPresent) {
          if ('bool' === property.type) {
            $$booleans -= 1;
          }
          continue;
        }
      }
      if ('bool' === property.type) {
        const index = Math.floor(currentBoolean / 8);
        const bit = currentBoolean % 8;
        currentBoolean += 1;
        booleanBackpatches.push({bit, index, key});
      }
      else {
        const decoded = codec.decode(view, byteOffset + read);
        value[key] = decoded.value;
        read += decoded.read;
      }
    }
    const booleanCount = Math.ceil($$booleans / 8);
    if (booleanCount > 0) {
      for (let i = 0; i < booleanCount; ++i) {
        booleanFlags.push(view.getUint8(byteOffset + read + i));
      }
      for (const {bit, index, key} of booleanBackpatches) {
        value[key] = !!(booleanFlags[index] & (1 << bit));
      }
      read += booleanCount;
    }
    return {read, value};
  }

  encode(value, view, byteOffset = 0) {
    const booleanFlags = [];
    const optionalFlags = [];
    let currentBoolean = 0;
    let currentOptional = 0;
    let written = 0;
    written += Math.ceil(this.$$optionals / 8);
    for (const {codec, key, property} of this.$$codecs) {
      if (property.optional) {
        const index = Math.floor(currentOptional / 8);
        const bit = currentOptional % 8;
        const isPresent = 'undefined' !== typeof value[key];
        optionalFlags[index] |= (isPresent ? 1 : 0) << bit;
        currentOptional += 1;
        if (!isPresent) {
          continue;
        }
      }
      if ('bool' === property.type) {
        const index = Math.floor(currentBoolean / 8);
        const bit = currentBoolean % 8;
        booleanFlags[index] |= (value[key] ? 1 : 0) << bit;
        currentBoolean += 1;
      }
      else {
        written += codec.encode(value[key], view, byteOffset + written);
      }
    }
    for (let i = 0; i < booleanFlags.length; ++i) {
      view.setUint8(byteOffset + written + i, booleanFlags[i]);
    }
    written += booleanFlags.length;
    for (let i = 0; i < optionalFlags.length; ++i) {
      view.setUint8(byteOffset + i, optionalFlags[i]);
    }
    return written;
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
