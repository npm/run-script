const t = require('tap')
const spawk = require('spawk')
const { delimiter } = require('node:path')
const setPATH = require('../lib/set-path.js')
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

t.test('spawn args', async t => {
  const testdir = t.testdir({})
  await t.test('defaults', async t => {
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
    await t.resolves(() => runScript({
      pkg,
      path: testdir,
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  await t.test('provided env', async t => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo test'),
      e => {
        return e.env.test_fixture === 'a string' &&
          e.env.npm_config_node_gyp === '/test/path.js'
      }
    )
    await t.resolves(() => runScript({
      pkg,
      path: testdir,
      env: {
        npm_config_node_gyp: '/test/path.js',
        test_fixture: 'a string',
      },
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  await t.test('provided options.nodeGyp', async t => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo test'),
      e => {
        return e.env.npm_config_node_gyp === '/test/path.js'
      }
    )
    await t.resolves(() => runScript({
      pkg,
      path: testdir,
      nodeGyp: '/test/path.js',
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  await t.test('provided args', async t => {
    spawk.spawn(
      /.*/,
      a => a.find(arg => arg.includes('echo test') && arg.includes('argtest'))
    )
    await t.resolves(() => runScript({
      pkg,
      path: testdir,
      args: ['argtest'],
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  t.test('event with invalid characters', async t => {
    spawk.spawn(
      /.*/,
      a => a.includes('echo weird'),
      e => {
        return e.env.npm_lifecycle_event === 'weird<x>\x04' &&
          e.env.npm_lifecycle_script === 'echo weird'
      }
    )
    await t.resolves(() => runScript({
      pkg,
      path: testdir,
      event: 'weird<x>\x04',
    }))
    t.ok(spawk.done())
  })

  await t.test('provided binPaths', async t => {
    spawk.spawn(
      /.*/,
      false,
      e => (e.env.PATH || e.env.Path).startsWith('/tmp/test-fixture/binpath')
    )
    await t.resolves(() => runScript({
      pkg,
      binPaths: ['/tmp/test-fixture/binpath'],
      path: testdir,
      args: ['test arg'],
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  await t.test('binPaths containing delimiter logs warning', async t => {
    const warnings = []
    const onWarn = (...args) => warnings.push(args)
    process.on('log', onWarn)
    t.teardown(() => process.off('log', onWarn))

    spawk.spawn(
      /.*/,
      false,
      e => (e.env.PATH || e.env.Path).includes(`/path/with${delimiter}delimiter`)
    )
    await t.resolves(() => runScript({
      pkg,
      binPaths: [`/path/with${delimiter}delimiter`],
      path: testdir,
      event: 'test',
    }))
    const warning = warnings.find(w => w[0] === 'warn' && w[1] === 'run-script' && w[2].includes('delimiter'))
    t.ok(warning, 'warning should be logged when binPath contains delimiter')
    t.match(warning[2], '"test" script')
    t.ok(spawk.done())
  })

  await t.test('binPaths containing delimiter uses generic message without event', async t => {
    const warnings = []
    const onWarn = (...args) => warnings.push(args)
    process.on('log', onWarn)
    t.teardown(() => process.off('log', onWarn))

    setPATH(testdir, [`/path/with${delimiter}delimiter`], {})

    const warning = warnings.find(w => w[0] === 'warn' && w[1] === 'run-script' && w[2].includes('delimiter'))
    t.ok(warning, 'warning should be logged with generic message when no event')
    t.match(warning[2], 'script execution')
  })
})

t.test('windows: a lone .exe runs without cmd.exe', async t => {
  const { win32 } = require('node:path')
  const platform = Object.getOwnPropertyDescriptor(process, 'platform')
  Object.defineProperty(process, 'platform', { ...platform, value: 'win32' })
  t.teardown(() => Object.defineProperty(process, 'platform', platform))
  const setEnv = (t, key, value) => {
    const old = process.env[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
    t.teardown(() => {
      if (old === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = old
      }
    })
  }
  setEnv(t, 'ComSpec', 'C:\\WINDOWS\\system32\\cmd.exe')
  setEnv(t, 'NoDefaultCurrentDirectoryInExePath', undefined)

  // what `which` finds for each path it is asked about
  const files = {
    'C:\\nodejs\\node': 'C:\\nodejs\\node.EXE',
    'C:\\nodejs\\echo': 'C:\\nodejs\\echo.EXE',
    'C:\\nodejs\\mkdir.exe': 'C:\\nodejs\\mkdir.exe',
    'C:\\nodejs\\tool': 'C:\\nodejs\\tool.EXE',
    'C:\\nodejs\\vite': 'C:\\nodejs\\vite.EXE',
    'C:\\proj\\tool': 'C:\\proj\\tool.EXE',
    'C:\\proj\\node_modules\\.bin\\vite': 'C:\\proj\\node_modules\\.bin\\vite.CMD',
    'C:\\proj\\bin\\server.exe': 'C:\\proj\\bin\\server.exe',
    'C:\\quoted dir\\quoted': 'C:\\quoted dir\\quoted.EXE',
  }
  let lookups = []
  const makeSpawnArgs = t.mock('../lib/make-spawn-args.js', {
    path: win32,
    '../lib/set-path.js': t.mock('../lib/set-path.js', { path: win32 }),
    which: {
      sync: (cmd, opts) => {
        lookups.push(cmd)
        t.strictSame(opts, { pathExt: '.EXE;.CMD', nothrow: true })
        return files[cmd] ?? null
      },
    },
  })
  const spawnArgs = (cmd, { args = [], env, ...opts } = {}) => {
    lookups = []
    return makeSpawnArgs({
      event: 'start',
      path: 'C:\\proj',
      env: { Path: 'C:\\nodejs', PATHEXT: '.EXE;.CMD', ...env },
      binPaths: false,
      cmd,
      args,
      ...opts,
    })
  }

  await t.test('an exe with plain arguments', async t => {
    const [cmd, args, opts] = spawnArgs('node  server.js --port 8765', { args: ['extra arg'] })
    t.equal(cmd, 'C:\\nodejs\\node.EXE')
    t.strictSame(args, ['server.js', '--port', '8765', 'extra arg'])
    t.equal(opts.shell, false)
    t.equal(opts.cwd, 'C:\\proj')
    t.strictSame(lookups.slice(0, 2), ['C:\\proj\\node', 'C:\\proj\\node_modules\\.bin\\node'],
      'looks in the current directory, then the PATH')
  })

  await t.test('the current directory comes before the PATH, like in cmd.exe', async t => {
    t.equal(spawnArgs('tool')[0], 'C:\\proj\\tool.EXE')
  })

  await t.test('unless NoDefaultCurrentDirectoryInExePath is set', async t => {
    const env = { NoDefaultCurrentDirectoryInExePath: '' }
    t.equal(spawnArgs('tool', { env })[0], 'C:\\nodejs\\tool.EXE')
  })

  await t.test('a quoted PATH entry', async t => {
    const env = { Path: '"C:\\quoted dir";C:\\nodejs' }
    t.equal(spawnArgs('quoted')[2].shell, true, 'not on the PATH')
    t.equal(spawnArgs('quoted', { env })[0], 'C:\\quoted dir\\quoted.EXE')
  })

  await t.test('a path relative to the current directory', async t => {
    const [cmd, args, opts] = spawnArgs('bin\\server.exe --port 8765')
    t.equal(cmd, 'C:\\proj\\bin\\server.exe')
    t.strictSame(args, ['--port', '8765'])
    t.equal(opts.shell, false)
    t.strictSame(lookups, ['C:\\proj\\bin\\server.exe'], 'does not search the PATH')
  })

  await t.test('with no PATH, only the current directory', async t => {
    const env = process.env
    process.env = { ComSpec: env.ComSpec }
    t.teardown(() => {
      process.env = env
    })
    lookups = []
    t.equal(makeSpawnArgs({ event: 'start', path: 'C:\\proj', env: { PATHEXT: '.EXE;.CMD' }, cmd: 'tool', args: [] })[0],
      'C:\\proj\\tool.EXE')
    t.strictSame(lookups, ['C:\\proj\\tool'])
  })

  await t.test('the first match is a .cmd: cmd.exe runs it', async t => {
    const [cmd, args, opts] = spawnArgs('vite build')
    t.equal(cmd, 'vite build')
    t.strictSame(args, [])
    t.equal(opts.shell, true)
    t.notOk(lookups.includes('C:\\nodejs\\vite'), 'stops at the first match')
  })

  await t.test('not found: cmd.exe reports it', async t => {
    t.equal(spawnArgs('nothere')[2].shell, true)
  })

  for (const cmd of ['echo hi', 'Echo hi', 'mkdir.exe dist']) {
    await t.test(`cmd.exe builtin: ${cmd}`, async t => {
      t.equal(spawnArgs(cmd)[2].shell, true)
      t.strictSame(lookups, [], 'does not look for a program')
    })
  }

  await t.test('a forward slash is a switch to cmd.exe', async t => {
    t.equal(spawnArgs('bin/server.exe')[2].shell, true)
  })

  const syntax = [
    'node a.js && node b.js',
    'node a.js > out.txt',
    'node a.js < in.txt',
    'node a.js | more',
    'node "a b.js"',
    'node %SCRIPT%',
    'node !SCRIPT!',
    'node a.js ^& more',
    '(node a.js)',
    'node a.js\r\nnode b.js',
  ]
  for (const cmd of syntax) {
    await t.test(`cmd.exe syntax: ${JSON.stringify(cmd)}`, async t => {
      t.equal(spawnArgs(cmd)[2].shell, true)
    })
  }

  await t.test('arguments that cmd.exe would expand', async t => {
    t.equal(spawnArgs('node a.js', { args: ['%PATH%'] })[2].shell, true)
  })

  await t.test('a script shell other than the default', async t => {
    t.equal(spawnArgs('node a.js', { scriptShell: 'cmd.exe' })[2].shell, 'cmd.exe')
    t.equal(spawnArgs('node a.js', { scriptShell: 'bash' })[2].shell, 'bash')
  })

  await t.test('ComSpec is not cmd.exe', async t => {
    setEnv(t, 'ComSpec', 'C:\\tools\\tcc.exe')
    t.equal(spawnArgs('node a.js')[2].shell, true)
  })

  await t.test('ComSpec is not set', async t => {
    setEnv(t, 'ComSpec', undefined)
    t.equal(spawnArgs('node a.js')[0], 'C:\\nodejs\\node.EXE')
  })
})
