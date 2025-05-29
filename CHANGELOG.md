# Changelog

## [2.1.0](https://github.com/cha0s/crunches/compare/crunches-v2.0.4...crunches-v2.1.0) (2025-05-29)


### Features

* endianness ([19bdca8](https://github.com/cha0s/crunches/commit/19bdca80bdad8b57885f68e293c5bf8f1be250d8))


### Bug Fixes

* 64-bit typed arrays ([86a3ebe](https://github.com/cha0s/crunches/commit/86a3ebece4aa2ad4fc8fdece84e1b891472c5760))

## [2.0.4](https://github.com/cha0s/crunches/compare/crunches-v2.0.3...crunches-v2.0.4) (2024-12-09)


### Bug Fixes

* array size byte offset ([2b7dcc8](https://github.com/cha0s/crunches/commit/2b7dcc80469bb095976ea1b2284e4ed3f01dd89e))

## [2.0.3](https://github.com/cha0s/crunches/compare/crunches-v2.0.2...crunches-v2.0.3) (2024-12-09)


### Bug Fixes

* pass offset to size ([e64185e](https://github.com/cha0s/crunches/commit/e64185e67afdb976c0b432ff421659a17efaf07e))

## [2.0.2](https://github.com/cha0s/crunches/compare/crunches-v2.0.1...crunches-v2.0.2) (2024-12-04)


### Bug Fixes

* export resolveCodec ([5626729](https://github.com/cha0s/crunches/commit/562672966979291b318f5a33d490a1060d15182a))

## [2.0.1](https://github.com/cha0s/crunches/compare/crunches-v2.0.0...crunches-v2.0.1) (2024-12-02)


### Bug Fixes

* benchmark ([34fc1cb](https://github.com/cha0s/crunches/commit/34fc1cbf8793624551916405c44be556024bb8a3))
* modern exports ([22275af](https://github.com/cha0s/crunches/commit/22275afd3be47083aa63535214c1615ac207069c))

## [2.0.0](https://github.com/cha0s/crunches/compare/crunches-v1.5.1...crunches-v2.0.0) (2024-12-02)


### ⚠ BREAKING CHANGES

* encoding ergonomics

### Features

* encoding ergonomics ([71b4442](https://github.com/cha0s/crunches/commit/71b44424b1240f391318c63830bc140fe578a10e))


### Bug Fixes

* alignment ([58ba4d0](https://github.com/cha0s/crunches/commit/58ba4d0af4a8da02df676fd050dc6cc12397a239))
* error ergonomics ([d9e373d](https://github.com/cha0s/crunches/commit/d9e373d95748fecf05b178177f882af9c28fb6fc))

## [1.5.1](https://github.com/cha0s/crunches/compare/crunches-v1.5.0...crunches-v1.5.1) (2024-12-01)


### Bug Fixes

* lib filename ([0471cac](https://github.com/cha0s/crunches/commit/0471cac723a5652f80c1ed5421f92a9770ca1ac4))

## [1.5.0](https://github.com/cha0s/crunches/compare/crunches-v1.4.1...crunches-v1.5.0) (2024-11-27)


### Features

* (u)int64 ([bcf83f1](https://github.com/cha0s/crunches/commit/bcf83f1dc5dda6d14494ed0f06767bd3fe7381f0))
* Schema::allocate ([91184cb](https://github.com/cha0s/crunches/commit/91184cb910de39aa985a1aa806a03df53e4a3dab))
* type aliases ([c0c6ed2](https://github.com/cha0s/crunches/commit/c0c6ed2429be2a4afcc7314669aa32fe573ad89d))

## [1.4.1](https://github.com/cha0s/crunches/compare/crunches-v1.4.0...crunches-v1.4.1) (2024-11-26)


### Bug Fixes

* bad iterator report ([2b4ce4e](https://github.com/cha0s/crunches/commit/2b4ce4ef237d66e151e6651b12cf52ec7a2bfbdd))
* let starved fixed-length arrays throw on encoding ([5354ef1](https://github.com/cha0s/crunches/commit/5354ef1cc82466b5328257f5caba981fe8ee2c17))

## [1.4.0](https://github.com/cha0s/crunches/compare/crunches-v1.3.0...crunches-v1.4.0) (2024-11-26)


### Features

* fixed-length arrays ([a10e37d](https://github.com/cha0s/crunches/commit/a10e37d57f4e2db080c5cdfd357d8c9024fa9585))
* optional varuint prefixes ([2d4702b](https://github.com/cha0s/crunches/commit/2d4702b1386bd409c4f4988b5889ad834f2fa61a))


### Bug Fixes

* count padding as written ([7e28ddf](https://github.com/cha0s/crunches/commit/7e28ddf3bcf517a22d759161744b224ec25d2518))
* object prototype ([75f0e9d](https://github.com/cha0s/crunches/commit/75f0e9d558470aacec691ec91716ad338f152b15))
* string size calc ([e3f4c5e](https://github.com/cha0s/crunches/commit/e3f4c5ef7b95dc71fb0682dbdc197e43214d3d0f))

## [1.3.0](https://github.com/cha0s/crunches/compare/crunches-v1.2.1...crunches-v1.3.0) (2024-11-26)


### Performance Improvements

* array codec ([a72404b](https://github.com/cha0s/crunches/commit/a72404ba7d307b421d9b567d7d5fc0c06ed64eab))


### Miscellaneous Chores

* doc ([1913a4c](https://github.com/cha0s/crunches/commit/1913a4c9099c5471d741baca6bd01e575d8cb131))

## [1.2.1](https://github.com/cha0s/crunches/compare/crunches-v1.2.0...crunches-v1.2.1) (2024-11-25)


### Bug Fixes

* buffer decoding perf ([99b943f](https://github.com/cha0s/crunches/commit/99b943f69232fdfa9e4f04f7f2333d5164cf872e))

## [1.2.0](https://github.com/cha0s/crunches/compare/crunches-v1.1.0...crunches-v1.2.0) (2024-11-25)


### Features

* object codec compilation ([9637235](https://github.com/cha0s/crunches/commit/9637235850b644ddb9468f66151b2b53a0753646))


### Bug Fixes

* perf ([ad0f8b8](https://github.com/cha0s/crunches/commit/ad0f8b84580f23dcd9785dd308015e54642ae17d))


### Performance Improvements

* byteOffset as a side-effect ([a1c9b8a](https://github.com/cha0s/crunches/commit/a1c9b8af8713d9bc85d1fea2016365c49c040255))
* defaults ([7ada42d](https://github.com/cha0s/crunches/commit/7ada42d58b8460f612d788afb9f3017723a6b15d))
* defaults ([5334760](https://github.com/cha0s/crunches/commit/5334760aeffc1c79532df12eadc689e23b901db8))
* mul vs pow ([4b95928](https://github.com/cha0s/crunches/commit/4b95928d3d91731cacf4d8dcb2a6269dc3a6b0ab))

## [1.1.0](https://github.com/cha0s/crunches/compare/crunches-v1.0.0...crunches-v1.1.0) (2024-11-25)


### Features

* varint ([e986f28](https://github.com/cha0s/crunches/commit/e986f287c798078438272e0d614020cd7f47727e))

## [1.0.0](https://github.com/cha0s/crunches/compare/crunches-v0.0.1...crunches-v1.0.0) (2024-11-24)


### Miscellaneous Chores

* initial ([76f7435](https://github.com/cha0s/crunches/commit/76f7435747f72d1f6e090b95338b65b1b016cf7c))
* provenance ([a0274ca](https://github.com/cha0s/crunches/commit/a0274caca16637f927c721862743a0fad3835651))
