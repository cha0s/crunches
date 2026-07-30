# crunches

TypeScript binary serialization library encoding to/from `ArrayBuffer`.

## Commands

| Command | What |
|---|---|
| `npm test` | Run all tests (vitest, `src` as root) |
| `npm run build` | `vite build && tsc && dts-bundle-generator --out-file dist/index.d.ts src/index.ts` |
| `npm run benchmark` | `npx tsx benchmark/run.ts` |

CI order (must pass sequentially): `tsc` (typecheck only, no emit) → `npm run test -- --run` → `npm run build`.

No linter or formatter is configured.

## Project structure

Single package, entrypoint `src/index.ts`. All codec types re-exported from separate files under `src/codecs/`.

## Testing

Tests are co-located with source as `*.test.ts`, using vitest. Run all tests: `npm test`. To run a single file: `npx vitest src/codecs/object.test.ts`. Import from `#crunches` (package.json `imports` alias).

## Codegen pattern

`CrunchesObject` (in `src/codecs/object.ts`) uses `new Function(...)` at construction time to build optimized encode/decode functions from string templates. When debugging or modifying object codec behavior, be aware of the codegen layer.

## Build artifacts

`dist/` is gitignored. The build runs vite (ESM bundle), then tsc (type checks), then dts-bundle-generator (rolls up `.d.ts`). Source maps included via `vite.config.ts`. Tests excluded from build via `tsconfig.build.json`.

## Endianness

Default is little-endian for all types. Override via `.bigEndian()` / `.littleEndian()` on any codec. Child codecs inherit parent endianness unless they've set their own.

## Type helpers

- `Infer<T>` → codec output type
- `InferInput<T>` → codec input type
- `ProtocolInfer<typeof protocol, 'packetName'>` → inferred payload of a protocol packet

## Release

Automated via release-please (manifest-based) + NPM publish on CI. Run `npx release-please manifest` locally to dry-run.
