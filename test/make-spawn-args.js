const t = require('tap')
const fs = require('fs')
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

const path = require('path')
const tmpdir = path.resolve(t.testdir())

const makeSpawnArgs = requireInject('../lib/make-spawn-args.js', {
  fs: {
    ...fs,
    chmodSync (_path, mode) {
      if (process.platform === 'win32') {
        _path = _path.replace(/\//g, '\\')
      } else {
        _path = _path.replace(/\\/g, '/')
      }
      return fs.chmodSync(_path, mode)
    },
    writeFileSync (_path, content) {
      if (process.platform === 'win32') {
        _path = _path.replace(/\//g, '\\')
      } else {
        _path = _path.replace(/\\/g, '/')
      }
      return fs.writeFileSync(_path, content)
    },
  },
  which,
  os: {
    ...require('os'),
    tmpdir: () => tmpdir,
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
      const [shell, args, opts, cleanup] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(shell, 'cmd', 'default shell applies')
      t.match(args, ['/d', '/s', '/c', /\.cmd$/], 'got expected args')
      t.match(opts, {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.ok(fs.existsSync(args[args.length - 1]), 'script file was written')
      cleanup()
      t.not(fs.existsSync(args[args.length - 1]), 'cleanup removes script file')

      t.end()
    })

    t.test('with a funky ComSpec', (t) => {
      process.env.ComSpec = 'blrorp'
      whichPaths.set('blrorp', '/bin/blrorp')
      t.teardown(() => {
        whichPaths.delete('blrorp')
      })
      const [shell, args, opts, cleanup] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(shell, 'blrorp', 'used ComSpec as default shell')
      t.match(args, ['-c', /\.sh$/], 'got expected args')
      t.match(opts, {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.ok(fs.existsSync(args[args.length - 1]), 'script file was written')
      cleanup()
      t.not(fs.existsSync(args[args.length - 1]), 'cleanup removes script file')

      t.end()
    })

    t.test('with cmd.exe as scriptShell', (t) => {
      const [shell, args, opts, cleanup] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
        scriptShell: 'cmd.exe',
      })
      t.equal(shell, 'cmd.exe', 'kept cmd.exe')
      t.match(args, ['/d', '/s', '/c', /\.cmd$/], 'got expected args')
      t.match(opts, {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.ok(fs.existsSync(args[args.length - 1]), 'script file was written')
      cleanup()
      t.not(fs.existsSync(args[args.length - 1]), 'cleanup removes script file')

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
      const [shell, args, opts, cleanup] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(shell, 'sh', 'defaults to sh')
      t.match(args, ['-c', /\.sh$/], 'got expected args')
      t.match(opts, {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.ok(fs.existsSync(args[args.length - 1]), 'script file was written')
      cleanup()
      t.not(fs.existsSync(args[args.length - 1]), 'cleanup removes script file')

      t.end()
    })

    t.test('can use cmd.exe', (t) => {
      // test that we can explicitly run in cmd.exe, even on posix systems
      // relevant for running under WSL
      const [shell, args, opts, cleanup] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
        scriptShell: 'cmd.exe',
      })
      t.equal(shell, 'cmd.exe', 'kept cmd.exe')
      t.match(args, ['/d', '/s', '/c', /\.cmd$/], 'got expected args')
      t.match(opts, {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }, 'got expected options')

      t.ok(fs.existsSync(args[args.length - 1]), 'script file was written')
      cleanup()
      t.not(fs.existsSync(args[args.length - 1]), 'cleanup removes script file')

      t.end()
    })

    t.end()
  })
}
