import { expect, test } from 'vitest'

import {
  array,
  CrunchesArray,
  CrunchesType,
  float32,
  float64,
  int8,
  int16,
  int32,
  int64,
  object,
  string,
  uint8,
  uint16,
  uint32,
  uint64,
} from '#crunches'

for (const numberType of [
  int8,
  uint8,
  int16,
  uint16,
  int32,
  uint32,
  float32,
  float64,
]) {
  const element = numberType()
  const codec = array({
    element,
  })
  const fixedLengthCodec = array({
    element,
    length: 4,
  })
  const numbers = [1, 2, 3, 4]
  const testNumberArray = (codec: CrunchesArray<any>, value: Iterable<number>) => {
    expect(codec.decode(codec.encode(value))).to.deep.equal(
      new element.typedArray(value),
    )
  }
  test(`${numberType.name} typed array`, () => {
    testNumberArray(codec, new element.typedArray(numbers))
  })
  test(`${numberType.name} array`, () => {
    testNumberArray(codec, numbers)
  })
  test(`${numberType.name} iterable`, () => {
    testNumberArray(codec, new Set(numbers))
  })
  test(`${numberType.name} fixed-length typed array`, () => {
    testNumberArray(fixedLengthCodec, new element.typedArray(numbers))
  })
  test(`${numberType.name} fixed-length array`, () => {
    testNumberArray(fixedLengthCodec, numbers)
  })
  test(`${numberType.name} fixed-length iterable`, () => {
    testNumberArray(fixedLengthCodec, new Set(numbers))
  })
  test(`sparse ${numberType.name} array`, () => {
    const codec = array({
      element,
      sparse: true,
    })
    const value = [1, 2, , 4]
    const sparseValue = new element.typedArray([
      1,
      2,
      (numberType === float32) || (numberType === float64) ? NaN : 0,
      4,
    ])
    expect(codec.decode(codec.encode(value))).to.deep.equal(sparseValue)
  })
  test(`sparse ${numberType.name} fixed-length array`, () => {
    const value = [1, 2, , 4]
    const sparseValue = new element.typedArray([
      1,
      2,
      (numberType === float32) || (numberType === float64) ? NaN : 0,
      4,
    ])
    const fixedLengthCodec = array({
      element,
      length: 4,
      sparse: true,
    })
    expect(fixedLengthCodec.decode(fixedLengthCodec.encode(value))).to.deep.equal(sparseValue)
  })
  test(`sparse ${numberType.name} iterable`, () => {
    const codec = array({
      element,
      sparse: true,
    })
    const value: number[] = []
    value[3] = 1
    value[6] = 1
    const iterable = {
      [Symbol.iterator]: function() {
        const protocol = value.values()
        return {
          next: () => {
            let result = protocol.next();
            if (result.done) {
              return {done: true, value: undefined};
            }
            return {done: false, value: result.value};
          },
        };
      }
    }
    expect(codec.decode(codec.encode(iterable))).to.deep.equal(value)
  })
}

for (const numberType of [
  int64,
  uint64,
]) {
  const element = numberType()
  const codec = array({
    element,
  })
  const testNumberArray = (value: Iterable<bigint>) => {
    expect(codec.decode(codec.encode(value))).to.deep.equal(
      new element.typedArray(value),
    )
  }
  test(`${numberType.name} typed array`, () => {
    testNumberArray(new element.typedArray([1n, 2n, 3n, 4n]))
  })
  test(`${numberType.name} array`, () => {
    testNumberArray([1n, 2n, 3n, 4n])
  })
  test(`${numberType.name} iterable`, () => {
    testNumberArray(new Set([1n, 2n, 3n, 4n]))
  })
  test(`sparse ${numberType.name} array`, () => {
    const codec = array({
      element,
      sparse: true,
    })
    const value = [1n, 2n, , 4n]
    expect(codec.decode(codec.encode(value))).to.deep.equal(value)
  })
  test(`sparse ${numberType.name} fixed-length array`, () => {
    const value = [1n, 2n, , 4n]
    const fixedLengthCodec = array({
      element,
      length: 4,
      sparse: true,
    })
    expect(fixedLengthCodec.decode(fixedLengthCodec.encode(value))).to.deep.equal(value)
  })
  test(`sparse ${numberType.name} iterable`, () => {
    const codec = array({
      element,
      sparse: true,
    })
    const value: bigint[] = []
    value[3] = 1n
    value[6] = 1n
    const iterable = {
      [Symbol.iterator]: function() {
        const protocol = value.values()
        return {
          next: () => {
            let result = protocol.next();
            if (result.done) {
              return {done: true, value: undefined};
            }
            return {done: false, value: result.value};
          },
        };
      }
    }
    expect(codec.decode(codec.encode(iterable))).to.deep.equal(value)
  })
}

test('string array', () => {
  const codec = array({
    element: string(),
  })
  const value = ['one', 'two', 'three', 'four']
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('fixed-length string array', () => {
  const codec = array({
    element: string(),
    length: 4,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('string iterable', () => {
  const codec = array({
    element: string(),
  })
  const value = ['one', 'two', 'three', 'four']
  expect(codec.decode(codec.encode(new Set(value)))).to.deep.equal(value)
})

test('fixed-length string iterable', () => {
  const codec = array({
    element: string(),
    length: 4,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(new Set(value))))).to.deep.equal(value)
})

test('sparse string array', () => {
  const codec = array({
    element: string(),
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(codec.decode(codec.encode(value))).to.deep.equal(value)
})

test('sparse fixed-length string array', () => {
  const codec = array({
    element: string(),
    length: 4,
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value)
})

test('sparse string iterable', () => {
  const codec = array({
    element: string(),
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(codec.decode(codec.encode(new Set(value)))).to.deep.equal(value)
})

test('sparse fixed-length string iterable', () => {
  const codec = array({
    element: string(),
    length: 4,
    sparse: true,
  })
  const value = ['one', 'two', , 'four']
  expect(Array.from(codec.decode(codec.encode(new Set(value))))).to.deep.equal(value)
})

test('fixed-length string drop', () => {
  const length = 3
  const codec = array({
    element: string(),
    length,
  })
  const value = ['one', 'two', 'three', 'four']
  expect(Array.from(codec.decode(codec.encode(value)))).to.deep.equal(value.slice(0, length))
})

test('fixed-length string starved', () => {
  const length = 3
  const codec = array({
    element: string(),
    length,
  })
  const value = ['one', 'two']
  expect(() => codec.size(value)).toThrow()
  expect(() => codec.encode(value)).toThrow()
})

function testAllAlignments(element: CrunchesType<any>, value: any, length = 0) {
  for (let i = 0; i < 8; ++i) {
    const spec: Record<string, CrunchesType<any>> = {}
    for (let j = 0; j < i; ++j) {
      spec[`o${j}`] = int8()
    }
    spec.array = array({ element, length })
    const codec = object(spec)
    const result: any = {}
    for (let j = 0; j < i; ++j) {
      result[`o${j}`] = j
    }
    result.array = value
    expect(Array.from(codec.decode(codec.encode(result)).array)).to.deep.equal(Array.from(result.array))
  }
}

for (const numberType of [
  int8,
  uint8,
  int16,
  uint16,
  int32,
  uint32,
  float32,
  float64,
]) {
  const element = numberType()
  test(`aligned ${numberType.name} array`, () => {
    testAllAlignments(element, [0, 1, 2])
  })
  test(`aligned ${numberType.name} typed array`, () => {
    testAllAlignments(element, new element.typedArray([0, 1, 2]))
  })
  test(`aligned ${numberType.name} iterable`, () => {
    testAllAlignments(element, new Set([0, 1, 2]))
  })
  test(`aligned fixed-length ${numberType.name} array`, () => {
    testAllAlignments(element, [0, 1, 2], 3)
  })
  test(`aligned fixed-length ${numberType.name} typed array`, () => {
    testAllAlignments(element, new element.typedArray([0, 1, 2]), 3)
  })
  test(`aligned fixed-length ${numberType.name} iterable`, () => {
    testAllAlignments(element, new Set([0, 1, 2]), 3)
  })
}

for (const numberType of [
  int64,
  uint64,
]) {
  const element = numberType()
  test(`aligned ${numberType.name} array`, () => {
    testAllAlignments(element, [0n, 1n, 2n])
  })
  test(`aligned ${numberType.name} typed array`, () => {
    testAllAlignments(element, new element.typedArray([0n, 1n, 2n]))
  })
  test(`aligned ${numberType.name} iterable`, () => {
    testAllAlignments(element, new Set([0n, 1n, 2n]))
  })
  test(`aligned fixed-length ${numberType.name} array`, () => {
    testAllAlignments(element, [0n, 1n, 2n], 3)
  })
  test(`aligned fixed-length ${numberType.name} typed array`, () => {
    testAllAlignments(element, new element.typedArray([0n, 1n, 2n]), 3)
  })
  test(`aligned fixed-length ${numberType.name} iterable`, () => {
    testAllAlignments(element, new Set([0n, 1n, 2n]), 3)
  })
}

test('prefix endianness', () => {
  // big
  expect(3).to.equal(array({element: uint32()}).bigEndian().encode([1, 2, 3]).getUint32(0, false))
  // default (little)
  expect(3).to.equal(array({element: uint32()}).encode([1, 2, 3]).getUint32(0, true))
  // little
  expect(3).to.equal(array({element: uint32()}).littleEndian().encode([1, 2, 3]).getUint32(0, true))
})

test('element endianness', () => {
  let encoded
  // big
  encoded = array({element: uint32(), length: 3}).bigEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, false))
  }
  // overridden (little)
  encoded = array({element: uint32().littleEndian(), length: 3}).bigEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, true))
  }
  // default (little)
  encoded = array({element: uint32(), length: 3}).encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, true))
  }
  // little
  encoded = array({element: uint32(), length: 3}).littleEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, true))
  }
  // overridden (big)
  encoded = array({element: uint32().bigEndian(), length: 3}).littleEndian().encode([1, 2, 3])
  for (let i = 0; i < 3; ++i) {
    expect(i + 1).to.equal(encoded.getUint32(4 * i, false))
  }
})
