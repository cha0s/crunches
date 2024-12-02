export const Aliases = {
  boolean: 'bool',
};

export const Codecs = {};

export function resolveCodec(blueprint) {
  if (!blueprint) {
    throw new TypeError('No blueprint specified.');
  }
  let {type} = blueprint;
  if (undefined === type) {
    try {
      resolveCodec({type: blueprint});
    }
    catch (error) {
      throw new TypeError("No codec specified. Did you forget to include a 'type' key in your schema blueprint?");
    }
    throw new TypeError(`Blueprint '${blueprint}' looks like a type. Try {type: '${blueprint}'}`);
  }
  const searched = new Set([type]);
  let Codec = Codecs[type];
  while (!Codec) {
    type = Aliases[type];
    if (!type || searched.has(type)) {
      throw new TypeError(`Codec not found: '${blueprint.type}'`);
    }
    searched.add(type)
    Codec = Codecs[type];
  }
  return new Codecs[type](blueprint);
}
