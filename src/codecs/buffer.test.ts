import {expect, test} from 'vitest'

import {
  buffer,
  map,
  string,
  uint8,
} from '#crunches'

test('buffer', () => {
  const mapSchema = map({
    key: uint8(),
    value: string(),
  })
  const value = new Map([[1, 'one'], [2, 'two']])
  const mapView = new DataView(new ArrayBuffer(mapSchema.size(value)))
  const mapEncodedSize = mapSchema.encodeInto(value, mapView, 0)
  const bufferSchema = buffer()
  const bufferView = new DataView(new ArrayBuffer(bufferSchema.size(mapView.buffer)))
  expect(bufferSchema.encodeInto(mapView.buffer, bufferView, 0)).to.equal(mapEncodedSize + 4)
  const newMapView = bufferSchema.decode(bufferView)
  expect(mapSchema.decode(newMapView)).to.deep.equal(value)
})

test('varuint-prefixed buffer', () => {
  const mapSchema = map({
    key: uint8(),
    value: string(),
  })
  const value = new Map([[1, 'one'], [2, 'two']])
  const mapView = new DataView(new ArrayBuffer(mapSchema.size(value)))
  const mapEncodedSize = mapSchema.encodeInto(value, mapView, 0)
  const bufferSchema = buffer({varuint: true})
  const bufferView = new DataView(new ArrayBuffer(bufferSchema.size(mapView.buffer)))
  bufferSchema.encodeInto(mapView.buffer, bufferView, 0)
  expect(bufferSchema.encodeInto(mapView.buffer, bufferView, 0)).to.equal(mapEncodedSize + 1)
  const newMapView = bufferSchema.decode(bufferView)
  expect(mapSchema.decode(newMapView)).to.deep.equal(value)
})
