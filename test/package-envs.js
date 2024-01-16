const t = require('tap')
const packageEnvs = require('../lib/package-envs.js')

t.strictSame(packageEnvs({}, {
  name: 'name',
  version: 'version',
  config: {
    number: 420.69,
    null: null,
    empty: '',
    zero: 0,
    false: false,
    nested: { object: { is: { included: true } } },
  },
  bin: {
    foo: './bar.js',
    bar: false,
  },
  engines: ['array', 'of', 'strings'],
  some: { other: 'thing' },
}), {
  npm_package_name: 'name',
  npm_package_version: 'version',
  npm_package_config_number: '420.69',
  npm_package_config_null: '',
  npm_package_config_empty: '',
  npm_package_config_zero: '0',
  npm_package_config_false: '',
  npm_package_config_nested_object_is_included: 'true',
  npm_package_engines_0: 'array',
  npm_package_engines_1: 'of',
  npm_package_engines_2: 'strings',
  npm_package_bin_foo: './bar.js',
  npm_package_bin_bar: '',
})

const foo = { foo: 'bar' }
const ret = packageEnvs(foo, {
  name: 'name',
  version: 'version',
})
t.not(ret, foo, 'returns new object')
t.strictSame(ret, {
  foo: 'bar',
  npm_package_name: 'name',
  npm_package_version: 'version',
}, 'new env object has new stuff')
t.strictSame(foo, { foo: 'bar' }, 'original unmodified')
