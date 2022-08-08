const t = require('tap')
const requireInject = require('require-inject')
const isWindows = require('../lib/is-windows.js')

if (!process.env.__FAKE_TESTING_PLATFORM__) {
  const fake = isWindows ? 'posix' : 'win32'
  t.spawn(process.execPath, [__filename, fake], { env: {
    ...process.env,
    __FAKE_TESTING_PLATFORM__: fake,
  } })
}

const whichPaths = new Map()
const which = {
  sync: (req) => {
    if (whichPaths.has(req)) {
      return whichPaths.get(req)
    }

    throw new Error('not found')
  },
}

const { dirname } = require('path')
const resolve = (...args) => {
  const root = isWindows ? 'C:\\Temp' : '/tmp'
  return [root, ...args].join(isWindows ? '\\' : '/')
}

const makeSpawnArgs = requireInject('../lib/make-spawn-args.js', {
  which,
  path: {
    dirname,
    resolve,
  },
})

if (isWindows) {
  t.test('windows', t => {
    // with no ComSpec
    delete process.env.ComSpec
    whichPaths.set('cmd', 'C:\\Windows\\System32\\cmd.exe')
    t.teardown(() => {
      whichPaths.delete('cmd')
    })

    t.test('simple script', (t) => {
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(shell, 'cmd', 'default shell applies')
      t.strictSame(args, ['/d', '/s', '/c',
        'script "quoted parameter"; second command',
      ], 'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.test('event with invalid characters runs', (t) => {
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event<:>\x03', // everything after the word "event" is invalid
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(shell, 'cmd', 'default shell applies')
      t.strictSame(args, ['/d', '/s', '/c',
        'script "quoted parameter"; second command',
      ], 'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event<:>\x03',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.test('with a funky ComSpec', (t) => {
      process.env.ComSpec = 'blrorp'
      whichPaths.set('blrorp', '/bin/blrorp')
      t.teardown(() => {
        whichPaths.delete('blrorp')
        delete process.env.ComSpec
      })
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(shell, 'blrorp', 'used ComSpec as default shell')
      t.strictSame(args, ['-c', '--', 'script "quoted parameter"; second command'],
        'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.end()
    })

    t.test('with cmd.exe as scriptShell', (t) => {
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
        scriptShell: 'cmd.exe',
      })
      t.equal(shell, 'cmd.exe', 'kept cmd.exe')
      t.strictSame(args, ['/d', '/s', '/c',
        'script ^"\\^"quoted^ parameter\\^";^" ^"second^ command^"',
      ], 'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.test('single escapes when initial command is not a batch file', (t) => {
      whichPaths.set('script', '/path/script.exe')
      t.teardown(() => whichPaths.delete('script'))

      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(shell, 'cmd', 'default shell applies')
      t.strictSame(args, ['/d', '/s', '/c',
        'script ^"\\^"quoted^ parameter\\^";^" ^"second^ command^"',
      ], 'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.test('double escapes when initial command is a batch file', (t) => {
      whichPaths.set('script', '/path/script.cmd')
      t.teardown(() => whichPaths.delete('script'))

      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(shell, 'cmd', 'default shell applies')
      t.strictSame(args, ['/d', '/s', '/c',
        'script ^^^"\\^^^"quoted^^^ parameter\\^^^";^^^" ^^^"second^^^ command^^^"',
      ], 'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.test('correctly identifies initial cmd with spaces', (t) => {
      // we do blind lookups in our test fixture here, however node-which
      // will remove surrounding quotes
      whichPaths.set('"my script"', '/path/script.cmd')
      t.teardown(() => whichPaths.delete('my script'))

      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: '"my script"',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(shell, 'cmd', 'default shell applies')
      t.strictSame(args, ['/d', '/s', '/c',
        '"my script" ^^^"\\^^^"quoted^^^ parameter\\^^^";^^^" ^^^"second^^^ command^^^"',
      ], 'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: '"my script"',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.end()
  })
} else {
  t.test('posix', t => {
    whichPaths.set('sh', '/bin/sh')
    t.teardown(() => {
      whichPaths.delete('sh')
    })

    t.test('simple script', (t) => {
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(shell, 'sh', 'defaults to sh')
      t.strictSame(args, ['-c', '--', `script '"quoted parameter";' 'second command'`],
        'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: '/tmp/path/package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.end()
    })

    t.test('event with invalid characters runs', (t) => {
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event<:>/\x04',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(shell, 'sh', 'defaults to sh')
      t.strictSame(args, ['-c', '--', `script '"quoted parameter";' 'second command'`],
        'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: '/tmp/path/package.json',
          npm_lifecycle_event: 'event<:>/\x04',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.end()
    })

    t.test('can use cmd.exe', (t) => {
      // test that we can explicitly run in cmd.exe, even on posix systems
      // relevant for running under WSL
      const [shell, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
        scriptShell: 'cmd.exe',
      })
      t.equal(shell, 'cmd.exe', 'kept cmd.exe')
      t.strictSame(args, ['/d', '/s', '/c', 'script "quoted parameter"; second command'],
        'got expected args')
      t.hasStrict(opts, {
        env: {
          npm_package_json: '/tmp/path/package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.end()
    })

    t.end()
  })
}
