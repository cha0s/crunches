import { type CrunchesType, type Target } from '#types';

import { varuint } from './codecs/varuint.ts'

const varuintCodec = varuint();

type Inputs<P extends Record<string, CrunchesType<unknown>>> = {
  [K in keyof P]: { type: K; payload: P[K]['_input'] }
}[keyof P];

type Payloads<P extends Record<string, CrunchesType<unknown>>> = {
  [K in keyof P]: { type: K; payload: P[K]['_output'] }
}[keyof P];

export type ProtocolInfer<T extends Protocol<any>, K extends T['_payloads']['type']> =
  Extract<T['_payloads'], { type: K }>['payload'];

export class Protocol<
  P extends Record<string, CrunchesType<unknown>>
> {

  declare _P: P;
  declare _inputs: Inputs<P>;
  declare _payloads: Payloads<P>;

  idToType = new Map<number, keyof P>();
  codecs = new Map<keyof P, CrunchesType<unknown>>();
  typeToId = new Map<keyof P, number>();

  constructor(codecMap: P) {
    let id = 1;
    for (const type in codecMap) {
      this.idToType.set(id, type);
      this.codecs.set(type, codecMap[type]);
      this.typeToId.set(type, id);
      id += 1;
    }
  }

  decode(view: DataView) {
    return this.decodeFrom(view, { byteOffset: 0 })
  }

  decodeFrom(view: DataView, target: Target) {
    const id = varuintCodec.decodeFrom(view, target);
    const type = this.idToType.get(id);
    if (!type) {
      throw new TypeError(`Tried decoding unknown codec: '${String(type)}'`)
    }
    const codec = this.codecs.get(type)
    if (!codec) {
      throw new TypeError(`Tried decoding unknown codec: '${String(type)}'`)
    }
    return {type, payload: codec.decodeFrom(view, target)} as Payloads<P>
  }

  encode<K extends keyof P>(type: K, value: P[K]['_input']) {
    const id = this.typeToId.get(type);
    if (!id) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    const codec = this.codecs.get(type)
    if (!codec) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    let size = varuintCodec.size(id)
    size += codec.sizeOf(value, size)
    const view = new DataView(new ArrayBuffer(size))
    this.encodeInto(type, value, view, 0)
    return view
  }

  encodeInto<K extends keyof P>(type: K, value: P[K]['_input'], view: DataView, byteOffset: number) {
    const id = this.typeToId.get(type);
    if (!id) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    let written = 0
    written += varuintCodec.encodeInto(id, view, byteOffset);
    const codec = this.codecs.get(type)
    if (!codec) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    written += codec.encodeInto(value, view, byteOffset + written);
    return written;
  }

}
