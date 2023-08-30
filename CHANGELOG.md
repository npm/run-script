# Changelog

## [7.0.0](https://github.com/npm/run-script/compare/v6.0.2...v7.0.0) (2023-08-30)

### ⚠️ BREAKING CHANGES

* support for node 14 has been removed

### Bug Fixes

* [`e1b1a3c`](https://github.com/npm/run-script/commit/e1b1a3c49370f60783879de9b228cbb2c0faeb2a) [#157](https://github.com/npm/run-script/pull/157) drop node14 support (@wraithgar)

### Dependencies

* [`a8045a9`](https://github.com/npm/run-script/commit/a8045a9d08a5a8440f7f2b3406a3c5142fcad5d1) [#157](https://github.com/npm/run-script/pull/157) bump which from 3.0.1 to 4.0.0

## [6.0.2](https://github.com/npm/run-script/compare/v6.0.1...v6.0.2) (2023-05-08)

### Bug Fixes

* [`545f3be`](https://github.com/npm/run-script/commit/545f3be94d412941537ad0011717933d48cb58cf) [#142](https://github.com/npm/run-script/pull/142) handle signals more correctly (#142) (@nlf)

### Documentation

* [`581be58`](https://github.com/npm/run-script/commit/581be58e689930cc1b832f510b971a111e27ff6a) [#141](https://github.com/npm/run-script/pull/141) fix syntax in example (#141) (@kas-elvirov)

## [6.0.1](https://github.com/npm/run-script/compare/v6.0.0...v6.0.1) (2023-04-27)

### Bug Fixes

* [`3a8f085`](https://github.com/npm/run-script/commit/3a8f0854bff739653ca704d2d8cfd4e4682dcc4e) [#147](https://github.com/npm/run-script/pull/147) remove unused dependency on minipass (#147) (@nlf)

## [6.0.0](https://github.com/npm/run-script/compare/v5.1.1...v6.0.0) (2022-11-02)

### ⚠️ BREAKING CHANGES

* `stdioString` is no longer set to `false` by default. Instead it is not set and passed directory to `@npmcli/promise-spawn` which defaults it to `true`.

### Features

* [`34ecf46`](https://github.com/npm/run-script/commit/34ecf46524fb8585223795ff7bb37a89f995762d) [#134](https://github.com/npm/run-script/pull/134) dont set a default for `stdioString` (@lukekarrys)

## [5.1.1](https://github.com/npm/run-script/compare/v5.1.0...v5.1.1) (2022-11-01)

### Dependencies

* [`40706eb`](https://github.com/npm/run-script/commit/40706eb573f969aaa65e4ab45a21edeab39130ca) [#132](https://github.com/npm/run-script/pull/132) `which@3.0.0` (#132)

## [5.1.0](https://github.com/npm/run-script/compare/v5.0.1...v5.1.0) (2022-11-01)

### Features

* [`45f2301`](https://github.com/npm/run-script/commit/45f2301931ba7686fa0a4b1a1d69ecc1892fdf85) let @npmcli/promise-spawn do the escaping (@nlf)

### Dependencies

* [`71c20af`](https://github.com/npm/run-script/commit/71c20af2e414691733ef7592baff6f11a14d8b32) [#130](https://github.com/npm/run-script/pull/130) `@npmcli/promise-spawn@6.0.0`

## [5.0.1](https://github.com/npm/run-script/compare/v5.0.0...v5.0.1) (2022-10-26)

### Dependencies

* [`1bfadcb`](https://github.com/npm/run-script/commit/1bfadcb1abadf316f229f4cad5a3bb8a623fd21a) [#127](https://github.com/npm/run-script/pull/127) bump @npmcli/promise-spawn from 4.0.0 to 5.0.0 (#127)

## [5.0.0](https://github.com/npm/run-script/compare/v4.2.1...v5.0.0) (2022-10-14)

### ⚠️ BREAKING CHANGES

* `@npmcli/run-script` is now compatible with the following semver range for node: `^14.17.0 || ^16.13.0 || >=18.0.0`

### Features

* [`891cb2a`](https://github.com/npm/run-script/commit/891cb2af4b65d23db28acfae62d028faaef6bddd) [#113](https://github.com/npm/run-script/pull/113) postinstall for dependabot template-oss PR (@lukekarrys)

### Dependencies

* [`d41405e`](https://github.com/npm/run-script/commit/d41405ea56350581f11378160e4b03a42ab0c393) [#121](https://github.com/npm/run-script/pull/121) bump @npmcli/node-gyp from 2.0.0 to 3.0.0 (#121)
* [`5fc0e27`](https://github.com/npm/run-script/commit/5fc0e2737ee92a1983a251dd4c8aa1d8768f3226) [#123](https://github.com/npm/run-script/pull/123) bump @npmcli/promise-spawn from 3.0.0 to 4.0.0
* [`132b84b`](https://github.com/npm/run-script/commit/132b84bbfd617d156118cb3469fa5cb3c9d7c958) [#120](https://github.com/npm/run-script/pull/120) bump read-package-json-fast from 2.0.3 to 3.0.0

## [4.2.1](https://github.com/npm/run-script/compare/v4.2.0...v4.2.1) (2022-08-09)


### Bug Fixes

* add arguments back to the logged banner ([#102](https://github.com/npm/run-script/issues/102)) ([8e08311](https://github.com/npm/run-script/commit/8e08311358a9f7c361e191b728eaada53eba607b))
* remove the temp file entirely ([#98](https://github.com/npm/run-script/issues/98)) ([82ef491](https://github.com/npm/run-script/commit/82ef49184eb494175582f2f4d6f359519b09edfb))

## [4.2.0](https://github.com/npm/run-script/compare/v4.1.7...v4.2.0) (2022-08-01)


### Features

* add binPaths param ([#99](https://github.com/npm/run-script/issues/99)) ([27cc108](https://github.com/npm/run-script/commit/27cc108d1553170f4a274da608b44c8ad550037c))

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
