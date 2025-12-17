const { describe, it, before } = require('node:test')
const assert = require('node:assert')
const testdirFn = require('./fixtures/testdir.js')
const spawk = require('spawk')
const runScript = require('..')

const pkg = {
  name: '@npmcli/run-script-test-package',
  version: '1.0.0-test',
  config: {
    test_string: 'a value',
    test_array: ['a string', 'another string'],
    test_null: null,
    test_false: false,
  },
  engines: {
    node: '>0.10',
    npm: '>1.2.3',
  },
  bin: 'index.js',
  scripts: {
    test: 'echo test',
    'weird<x>\x04': 'echo weird',
  },
}

describe('spawn args', (t) => {
  let testdir
  before(() => {
    testdir = testdirFn(t, {})
  })
  it('defaults', async () => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo test'),
      e => {
        return e.cwd === testdir &&
          e.stdio === 'pipe' &&
          e.stdioString === undefined &&
          e.shell === false &&
          e.env.npm_package_json.endsWith('package.json') &&
          e.env.npm_package_name === pkg.name &&
          e.env.npm_package_version === pkg.version &&
          e.env.npm_package_config_test_null === '' &&
          e.env.npm_package_config_test_false === '' &&
          e.env.npm_package_config_test_string === pkg.config.test_string &&
          e.env.npm_package_config_test_array_0 === pkg.config.test_array[0] &&
          e.env.npm_package_config_test_array_1 === pkg.config.test_array[1] &&
          e.env.npm_package_bin === pkg.bin &&
          e.env.npm_package_engines_npm === pkg.engines.npm &&
          e.env.npm_package_engines_node === pkg.engines.node &&
          e.env.npm_lifecycle_event === 'test' &&
          e.env.npm_lifecycle_script === 'echo test' &&
          e.env.npm_config_node_gyp === require.resolve('node-gyp/bin/node-gyp.js')
      }
    )
    await runScript({
      pkg,
      path: testdir,
      event: 'test',
    })
    assert.ok(spawk.done())
  })

  it('provided env', async () => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo test'),
      e => {
        return e.env.test_fixture === 'a string' &&
          e.env.npm_config_node_gyp === '/test/path.js'
      }
    )
    await runScript({
      pkg,
      path: testdir,
      env: {
        npm_config_node_gyp: '/test/path.js',
        test_fixture: 'a string',
      },
      event: 'test',
    })
    assert.ok(spawk.done())
  })

  it('provided options.nodeGyp', async () => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo test'),
      e => {
        return e.env.npm_config_node_gyp === '/test/path.js'
      }
    )
    await runScript({
      pkg,
      path: testdir,
      nodeGyp: '/test/path.js',
      event: 'test',
    })
    assert.ok(spawk.done())
  })

  it('provided args', async () => {
    spawk.spawn(
      /.*/,
      a => a.find(arg => arg.includes('echo test') && arg.includes('argtest'))
    )
    await runScript({
      pkg,
      path: testdir,
      args: ['argtest'],
      event: 'test',
    })
    assert.ok(spawk.done())
  })

  it('event with invalid characters', async () => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo weird'),
      e => {
        return e.env.npm_lifecycle_event === 'weird<x>\x04' &&
          e.env.npm_lifecycle_script === 'echo weird'
      }
    )
    await runScript({
      pkg,
      path: testdir,
      event: 'weird<x>\x04',
    })
    assert.ok(spawk.done())
  })

  it('provided binPaths', async () => {
    spawk.spawn(
      /.*/,
      false,
      e => (e.env.PATH || e.env.Path).startsWith('/tmp/test-fixture/binpath')
    )
    await runScript({
      pkg,
      binPaths: ['/tmp/test-fixture/binpath'],
      path: testdir,
      args: ['test arg'],
      event: 'test',
    })
    assert.ok(spawk.done())
  })
})
