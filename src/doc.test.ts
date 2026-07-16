import { describe, expect, test } from 'vitest'

import {
  array,
  boolean,
  CrunchesString,
  CrunchesType,
  float32,
  int32,
  json,
  map,
  object,
  type ProtocolInfer,
  Protocol,
  set,
  string,
  type Target,
  uint8,
  uint32,
  varuint,
} from '#crunches'

describe('documentation', () => {

  const playerSchema = object({
    position: array({
      element: float32(),
      length: 3,
    }),
    health: varuint(),
    jumping: boolean(),
    attributes: object({
      str: uint8(),
      agi: uint8(),
      int: uint8(),
    }),
  })

  const player = {
    position: [-540.2378623, 343.183749, 1201.23897468],
    health: 4000,
    jumping: false,
    attributes: { str: 87, agi: 42, int: 22 },
  }

  test('player schema', () => {
    const view = playerSchema.encode(player)
    const decoded = playerSchema.decode(view)
    expect(decoded.health).to.deep.equal(player.health)
    expect(decoded.jumping).to.deep.equal(player.jumping)
    expect(decoded.attributes).to.deep.equal(player.attributes)
    for (let i = 0; i < 3; ++i) {
      expect(decoded.position[i]).to.be.closeTo(player.position[i], 0.01)
    }
  })

  test('unsugar 1', () => {
    // create a view for our value
    const view = playerSchema.allocate(player)
    // pass the view to the encoder
    playerSchema.encodeInto(player, view, 0)
  })

  test('unsugar 2', () => {
    // get the schema size
    const size = playerSchema.size(player)
    // allocate a buffer
    const buffer = new ArrayBuffer(size)
    // create a view over the buffer
    const view = new DataView(buffer)
    // pass the view to the encoder
    playerSchema.encodeInto(player, view, 0)
  })

  test('json', () => {
    const codec = json({
      replacer: ['foo'],
      reviver: (_k: string, v: number) => v,
      space: 2,
    })
    codec.encode({ foo: 'bar', whatever: 'this', could: { be: [1, 100.5, 'or anything else'] }})
  })

  test('object', () => {
    const schema = object({
      foo: uint32(),
      bar: string().optional(),
    })
    // 14 = uint32 (4) + optional flag (1) + string prefix (4) + 'hello' (5)
    expect(schema.size({ foo: 32, bar: 'hello' })).to.equal(14)
    // 5 = uint32 (4) + optional flag (1)
    expect(schema.size({ foo: 32 })).to.equal(5)
  })

  test ('deepOptional', () => {
    const codec = object({
      1: uint8(),
      2: uint8(),
      3: object({
        4: uint8(),
      }),
    }).deepOptional()
    let value
    value = { 1: 32, 2: 32, 3: { 4: 32 } }
    expect(codec.size(value)).to.equal(5)
    value = { 1: 32, 2: 32, 3: {} }
    expect(codec.size(value)).to.equal(4)
    value = { 1: 32, 2: 32 }
    expect(codec.size(value)).to.equal(3)
    value = { 1: 32 }
    expect(codec.size(value)).to.equal(2)
    value = {}
    expect(codec.size(value)).to.equal(1)
  })

  test('array', () => {
    // 16 = array prefix (4) + uint32 (4) + uint32 (4) + uint32 (4)
    expect(array({ element: uint32() }).size([1, 2, 3])).to.equal(16)
    // 12 = uint32 (4) + uint32 (4) + uint32 (4)
    expect(array({ element: uint32(), length: 3 }).size([1, 2, 3])).to.equal(12)
  })

  test('sparse array', () => {
    const schema = array({
      element: string(),
      sparse: true,
    })
    expect(schema.size(['foo', , 'bar'])).to.equal(24)
  })

  test('map', () => {
    const schema = map({
      key: int32(),
      value: string(),
    })
    const value = new Map<number, string>()
    value.set(32, 'sup')
    value.set(64, 'hi')
    // 25 = array prefix (4) + int32 (4) + string prefix (4) + 'sup' (3) + int32 (4) + string prefix (4) + 'hi' (2)
    expect(schema.size(value)).to.equal(25)
    // same, with coercion
    expect(schema.size([[32, 'sup'], [64, 'hi']])).to.equal(25)
  })

  test('sparse map', () => {
    const schema = map({
      key: uint8(),
      value: string(),
      sparse: true,
    })
    const entries = [[1, 'one'], [2, undefined], [3, 'bar']] as Iterable<[number, string]>
    expect(schema.size(entries)).to.equal(27)
  })

  test('set', () => {
    const schema = set({
      element: string(),
    })
    const value = new Set<string>()
    value.add('foo')
    value.add('bar')
    // 18 = array prefix (4) + string prefix (4) + 'foo' (3) + string prefix (4) + 'bar' (3)
    expect(schema.size(value)).to.equal(18)
    // same, with coercion
    expect(schema.size(['foo', 'bar'])).to.equal(18)
  })

  test('protocol', () => {
    type Listener = (event: MessageEvent) => void
    const socket: {
      addEventListener: (_type: string, fn: Listener) => void,
      listener: Listener,
      send: (view: DataView) => void,
    } = {
      addEventListener(_type: string, fn: Listener) {
        this.listener = fn
      },
      listener: () => {},
      send(view: DataView) {
        this.listener(new MessageEvent('message', { data: view.buffer }))
      },
    }

    const protocol = new Protocol({
      heartbeat: uint32(),
      message: object({
        body: string(),
        from: string().optional(),
      }),
    })

    let lastReceivedHeartbeat: number = 0
    // infer payload type
    const messages: ProtocolInfer<typeof protocol, 'message'>[] = []
    socket.addEventListener('message', (event: MessageEvent) => {
      const { type, payload } = protocol.decode(new DataView(event.data))
      switch (type) {
        case 'heartbeat': {
          lastReceivedHeartbeat = payload
          break
        }
        case 'message': {
          messages.push(payload)
          break
        }
      }
    })

    socket.send(protocol.encode('heartbeat', 1234))
    socket.send(protocol.encode('message', {
      body: 'Hello!',
      from: 'admin',
    }))

    expect(lastReceivedHeartbeat).to.equal(1234)
    expect(messages).to.deep.equal([{ body: 'Hello!', from: 'admin' }])
  })

  test('optional size', () => {
    const stateSchema = object({
      position: array({
        element: float32(),
        length: 3,
      }).optional(),
      health: varuint().optional(),
      jumping: boolean().optional(),
      attributes: object({
        str: uint8(),
        agi: uint8(),
        int: uint8(),
      }).optional(),
    })
    expect(stateSchema.size({})).to.equal(1)
  })

  test('varuint prefixes', () => {
    const schema = string({
      varuint: true,
    })
    // 6 = varuint prefix (1) + 'hello' (5)
    expect(schema.size('hello')).to.equal(6)
  })

  test('endianness', () => {
    object({
      health: varuint(), // by default, properties inherit the endianness of their parent
      strength: varuint(), // so, these properties are big endian
      accumulator: uint32().littleEndian(), // but children may override their endianness
    }).bigEndian(); // the object is big endian
  })

  test('extensibile', () => {
    class MySuperCustomDate extends CrunchesType<Date, Date | string | number> {
      private readonly $$string: CrunchesString

      constructor() {
        super()
        this.$$string = new CrunchesString()
        this.$$string.isLittleEndian = this.isLittleEndian
      }

      decodeFrom(view: DataView, target: Target): Date {
        return new Date(this.$$string.decodeFrom(view, target))
      }

      encodeInto(
        value: Date | string | number,
        view: DataView,
        byteOffset: number,
      ): number {
        return this.$$string.encodeInto(new Date(value).toISOString(), view, byteOffset)
      }

      sizeOf(value: Date | string | number): number {
        return this.$$string.sizeOf(new Date(value).toISOString())
      }
    }

    const mySuperCustomDate = () => new MySuperCustomDate()

    const schema = object({
      name: string(),
      when: mySuperCustomDate(),
    })

    const encoded = schema.encode({
      name: 'John Doe',
      when: 1234567890123,
    })

    expect(schema.decode(encoded)).to.deep.equal({
      name: 'John Doe',
      when: new Date('2009-02-13T23:31:30.123Z')
    })
  })

  test('prefixes', () => {
    const schema = string({
      varuint: true,
    })
    // 6 = varuint prefix (1) + 'hello' (5)
    expect(schema.size('hello')).to.equal(6)
  })

})
