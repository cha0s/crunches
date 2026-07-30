import { type CrunchesType, type Target } from '#types'

import { varuint } from './codecs/varuint.ts'

const varuintCodec = varuint()

type Inputs<P extends Record<string, CrunchesType<unknown>>> = {
  [K in keyof P]: { type: K; payload: P[K]['_input'] }
}[keyof P]

type Payloads<P extends Record<string, CrunchesType<unknown>>> = {
  [K in keyof P]: { type: K; payload: P[K]['_output'] }
}[keyof P]

export type ProtocolInfer<T extends Protocol<any>, K extends T['_payloads']['type']> =
  Extract<T['_payloads'], { type: K }>['payload']

/**
 * Define a protocol; a mapping of string names to codecs.
 */
export class Protocol<
  P extends Record<string, CrunchesType<unknown>>
> {

  declare _P: P
  declare _inputs: Inputs<P>
  declare _payloads: Payloads<P>

  idToType = new Map<number, keyof P>()
  codecs = new Map<keyof P, CrunchesType<unknown>>()
  typeToId = new Map<keyof P, number>()

  constructor(codecMap: P) {
    let id = 1
    for (const type in codecMap) {
      this.idToType.set(id, type)
      this.codecs.set(type, codecMap[type])
      this.typeToId.set(type, id)
      id += 1
    }
  }

  /**
   * Decode a packet.
   * @param view The DataView from which to decode.
   * @returns The decoded packet.
   */
  decode(view: DataView) {
    return this.decodeFrom(view, { byteOffset: 0 })
  }

  /**
   * Decode a packet from a DataView
   * @param view The DataView to decode from.
   * @param target Target location.
   * @param target.byteOffset The offset from which to start decoding.
   * @returns The decoded packet.
   */
  decodeFrom(view: DataView, target: Target) {
    const id = varuintCodec.decodeFrom(view, target)
    const type = this.idToType.get(id)
    if (!type) {
      throw new TypeError(`Tried decoding unknown codec ID: '${String(id)}'`)
    }
    const codec = this.codecs.get(type)
    if (!codec) {
      throw new TypeError(`Tried decoding unknown codec type: '${String(type)}'`)
    }
    return { type, payload: codec.decodeFrom(view, target) } as Payloads<P>
  }

  /**
   * Encode a packet.
   * @param type The packet type.
   * @param payload The payload to encode.
   * @returns A DataView containing the encoded packet.
   */
  encode<K extends keyof P>(type: K, payload: P[K]['_input']) {
    const id = this.typeToId.get(type)
    if (!id) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    const codec = this.codecs.get(type)
    if (!codec) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    let size = varuintCodec.size(id)
    size += codec.sizeOf(payload, size)
    const view = new DataView(new ArrayBuffer(size))
    this.encodeInto(type, payload, view, 0)
    return view
  }

  /**
   * Enbcode a packet into a DataView.
   * @param type The packet type.
   * @param payload The payload to encode.
   * @param view The DataView to encode into.
   * @param byteOffset The offset from which to start encoding.
   * @returns The number of bytes written.
   */
  encodeInto<K extends keyof P>(type: K, value: P[K]['_input'], view: DataView, byteOffset: number) {
    const id = this.typeToId.get(type)
    if (!id) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    let written = 0
    written += varuintCodec.encodeInto(id, view, byteOffset)
    const codec = this.codecs.get(type)
    if (!codec) {
      throw new TypeError(`Tried encoding unknown codec: '${String(type)}'`)
    }
    written += codec.encodeInto(value, view, byteOffset + written)
    return written
  }

}
