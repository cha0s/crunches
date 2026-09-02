const reiterated = new WeakMap<object, object>()

/**
 * Returns `value` unchanged when it can be iterated any number of times
 * (arrays, typed arrays, Sets, Maps) or isn't iterable at all. One-shot
 * iterables such as generators are snapshotted on first encounter and
 * replayed from that snapshot on every subsequent call, since codecs
 * consume their input once for sizing and again for encoding.
 */
export function reiterable<T>(value: T): T {
  if (
    null === value
    || 'object' !== typeof value
    || 'function' !== typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator]
    || Array.isArray(value)
    || ArrayBuffer.isView(value)
    || value instanceof Set
    || value instanceof Map
  ) {
    return value
  }
  const cached = reiterated.get(value as object)
  if (cached) {
    return cached as T
  }
  const entries = Array.from(value as unknown as Iterable<unknown>)
  const wrapper = {
    [Symbol.iterator]: function* () {
      yield* entries
    },
  }
  reiterated.set(value as object, wrapper)
  reiterated.set(wrapper, wrapper)
  return wrapper as unknown as T
}
