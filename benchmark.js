// acrobatics! run vite on... ourselves
if (!process.env.INSIDE_VITE) {
  // suppress spam
  console.debug = () => {};
  const {createServer, createViteRuntime} = await import('vite');
  const viteDevServer = await createServer();
  const runtime = await createViteRuntime(viteDevServer);
  process.env.INSIDE_VITE = true;
  await runtime.executeEntrypoint('/benchmark.js');
}
else {

  const {Buffer} = await import('node:buffer');
  const {default: SchemaPack} = await import('schemapack');
  const {Schema} = await import('./src/index.js');

  SchemaPack.setValidateByDefault(false);

  const blueprint = {
    properties: {
      name: {type: 'string'},
      age: {type: 'uint8'},
      weight: {type: 'float32'},
      likes: {element: {type: 'uint8'}, type: 'array'},
      varints: {element: {type: 'varuint'}, type: 'array'},
      opaque: {type: 'buffer'},
    },
    type: 'object',
  };

  const specification = {
    name: 'string',
    age: 'uint8',
    weight: 'float32',
    likes: ['uint8'],
    varints: ['varuint'],
    opaque: 'buffer',
  };

  const opaque = Buffer.alloc(512);

  const value = {
    name: 'John Smith',
    age: 32,
    weight: 188.5,
    likes: Array(512).fill(0),
    varints: Array(512).fill(0),
  };

  const N = 10000;

  console.group('encoding x', N);

  const schemaPackPerson = SchemaPack.build(specification);
  value.opaque = opaque;
  const schemaPackBuffer = schemaPackPerson.encode(value);
  for (let i = 0; i < N; ++i) {
    schemaPackPerson.encode(value);
  }
  const schemaPackEncodeStart = performance.now();
  for (let i = 0; i < N; ++i) {
    schemaPackPerson.encode(value);
  }
  console.log('SchemaPack\t', performance.now() - schemaPackEncodeStart);

  const crunchesPerson = new Schema(blueprint);
  value.opaque = opaque.buffer;
  const crunchesView = new DataView(new ArrayBuffer(crunchesPerson.size(value)));
  for (let i = 0; i < N; ++i) {
    crunchesPerson.encode(value, crunchesView);
  }
  const crunchesEncodeStart = performance.now();
  for (let i = 0; i < N; ++i) {
    crunchesPerson.encode(value, crunchesView);
  }
  console.log('crunches\t', performance.now() - crunchesEncodeStart);

  console.groupEnd();

  console.group('decoding x', N);

  for (let i = 0; i < N; ++i) {
    schemaPackPerson.decode(schemaPackBuffer);
  }
  const schemaPackDecodeStart = performance.now();
  for (let i = 0; i < N; ++i) {
    schemaPackPerson.decode(schemaPackBuffer);
  }
  console.log('SchemaPack\t', performance.now() - schemaPackDecodeStart);

  for (let i = 0; i < N; ++i) {
    crunchesPerson.decode(crunchesView);
  }
  const crunchesDecodeStart = performance.now();
  for (let i = 0; i < N; ++i) {
    crunchesPerson.decode(crunchesView);
  }
  console.log('crunches\t', performance.now() - crunchesDecodeStart);

  console.groupEnd();

  process.exit(0);
}
