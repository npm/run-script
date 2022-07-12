# Changelog

## [4.1.7](https://github.com/npm/run-script/compare/v4.1.6...v4.1.7) (2022-07-12)


### Bug Fixes

* correctly translate paths when using bash in windows ([#96](https://github.com/npm/run-script/issues/96)) ([756ff56](https://github.com/npm/run-script/commit/756ff56d663f8a3634a7f48c17a2264295b51ccb))

## [4.1.6](https://github.com/npm/run-script/compare/v4.1.5...v4.1.6) (2022-07-12)


### Bug Fixes

* tighten up the character set that will be removed ([#93](https://github.com/npm/run-script/issues/93)) ([d510209](https://github.com/npm/run-script/commit/d5102099d651ba31566e2f79f09f689fa16fcef3))
* unique filename for temporary script files ([#95](https://github.com/npm/run-script/issues/95)) ([9f93025](https://github.com/npm/run-script/commit/9f930253c755a80435e8d47a7e086ff0ab8f03d2))

## [4.1.5](https://github.com/npm/run-script/compare/v4.1.4...v4.1.5) (2022-06-28)


### Bug Fixes

* add which to dependencies ([#88](https://github.com/npm/run-script/issues/88)) ([0bc2eec](https://github.com/npm/run-script/commit/0bc2eec2ccf6a9007e0fe9ea8200b2b12f847bfd))

## [4.1.4](https://github.com/npm/run-script/compare/v4.1.3...v4.1.4) (2022-06-27)


### Bug Fixes

* remove invalid characters from filename ([#86](https://github.com/npm/run-script/issues/86)) ([2354d06](https://github.com/npm/run-script/commit/2354d064e6ef833d9797bf70c333455f075d1b3b))

## [4.1.3](https://github.com/npm/run-script/compare/v4.1.2...v4.1.3) (2022-06-23)


### Bug Fixes

* escape spaces in cmd scripts too ([#84](https://github.com/npm/run-script/issues/84)) ([0bca5be](https://github.com/npm/run-script/commit/0bca5be97ff14e33d6e984e8c48bf35e3e6512ee))

## [4.1.2](https://github.com/npm/run-script/compare/v4.1.1...v4.1.2) (2022-06-22)


### Bug Fixes

* remove extraneous space when no additional args are passed ([#82](https://github.com/npm/run-script/issues/82)) ([9e09bab](https://github.com/npm/run-script/commit/9e09babbc662e25631b15ea7e8e33e0fd331eee5))

## [4.1.1](https://github.com/npm/run-script/compare/v4.1.0...v4.1.1) (2022-06-22)


### Bug Fixes

* correctly double escape when script runs a known .cmd file ([#80](https://github.com/npm/run-script/issues/80)) ([0f613cd](https://github.com/npm/run-script/commit/0f613cd1bed4d5f04e91da89ac747a3a00083146))

## [4.1.0](https://github.com/npm/run-script/compare/v4.0.0...v4.1.0) (2022-06-21)


### Features

* write scripts to a file and run that instead of passing scripts as a single string ([24c5165](https://github.com/npm/run-script/commit/24c5165e44846f4cf97b90fddfea5471600247f6))


### Bug Fixes

* cleanup temp script after running ([7963ab5](https://github.com/npm/run-script/commit/7963ab5f6256fe5e51b7656282499bd7fa19add6))

## [4.0.0](https://github.com/npm/run-script/compare/v3.0.3...v4.0.0) (2022-06-02)


### ⚠ BREAKING CHANGES

* changes engines support to `^12.22 || ^14.13 || >=16`

### Dependencies

* bump node-gyp from 8.4.1 to 9.0.0 ([#76](https://github.com/npm/run-script/issues/76)) ([e62e3a5](https://github.com/npm/run-script/commit/e62e3a5edc30e8216e43183c195927143ebc35ea))

### [3.0.3](https://github.com/npm/run-script/compare/v3.0.2...v3.0.3) (2022-05-25)


### Dependencies

* node-gyp@8.4.1 ([#73](https://github.com/npm/run-script/issues/73)) ([c4c472f](https://github.com/npm/run-script/commit/c4c472f1d500f3b854dd73899a08071ffec86d3e))

### [3.0.2](https://github.com/npm/run-script/compare/v3.0.1...v3.0.2) (2022-04-05)


### Dependencies

* bump @npmcli/node-gyp from 1.0.3 to 2.0.0 ([#65](https://github.com/npm/run-script/issues/65)) ([731240d](https://github.com/npm/run-script/commit/731240d641418478f5ceb86566dc2f48f5ec0975))
* bump @npmcli/promise-spawn from 1.3.2 to 3.0.0 ([#67](https://github.com/npm/run-script/issues/67)) ([afcab18](https://github.com/npm/run-script/commit/afcab182f0b9264f847e4911fc3d516d25efa195))

### [3.0.1](https://www.github.com/npm/run-script/compare/v3.0.0...v3.0.1) (2022-03-02)


### Dependencies

* bump node-gyp from 8.4.1 to 9.0.0 ([#52](https://www.github.com/npm/run-script/issues/52)) ([148ce21](https://www.github.com/npm/run-script/commit/148ce213fd7b208295dfa743b5bbf6f2032f22ce))

## [3.0.0](https://www.github.com/npm/run-script/compare/v2.0.0...v3.0.0) (2022-02-23)


### ⚠ BREAKING CHANGES

* this will drop support for node10 and non-LTS versions of node12 and node14

### Features

* implement template-oss ([#43](https://www.github.com/npm/run-script/issues/43)) ([a5b03bd](https://www.github.com/npm/run-script/commit/a5b03bdfc3a499bf7587d7414d5ea712888bfe93))


### Dependencies

* update @npmcli/node-gyp requirement from ^1.0.2 to ^1.0.3 ([#47](https://www.github.com/npm/run-script/issues/47)) ([cdd27cc](https://www.github.com/npm/run-script/commit/cdd27cc2e09b2aa1032c024401ee1981d3f4dc0a))
* update node-gyp requirement from ^8.2.0 to ^8.4.1 ([#45](https://www.github.com/npm/run-script/issues/45)) ([1575902](https://www.github.com/npm/run-script/commit/1575902c2e4a53874252bcc71bf4abe9e7bbe7e4))
* update read-package-json-fast requirement from ^2.0.1 to ^2.0.3 ([#48](https://www.github.com/npm/run-script/issues/48)) ([7747c5a](https://www.github.com/npm/run-script/commit/7747c5ae954bafba7d1c42d9bae4643fcbb21bce))
