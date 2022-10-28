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

const { dirname } = require('path')
const resolve = (...args) => {
  const root = isWindows ? 'C:\\Temp' : '/tmp'
  return [root, ...args].join(isWindows ? '\\' : '/')
}

const makeSpawnArgs = requireInject('../lib/make-spawn-args.js', {
  path: {
    dirname,
    resolve,
  },
})

if (isWindows) {
  t.test('windows', t => {
    const comSpec = process.env.ComSpec
    process.env.ComSpec = 'C:\\Windows\\System32\\cmd.exe'
    t.teardown(() => {
      process.env.ComSpec = comSpec
    })

    t.test('simple script', (t) => {
      const [cmd, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(cmd, 'script "quoted parameter"; second command')
      t.strictSame(args, [])
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        shell: true,
        stdio: undefined,
        cwd: 'path',
      }, 'got expected options')

      t.end()
    })

    t.test('event with invalid characters runs', (t) => {
      const [cmd, args, opts] = makeSpawnArgs({
        event: 'event<:>\x03', // everything after the word "event" is invalid
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
      })
      t.equal(cmd, 'script "quoted parameter"; second command')
      t.strictSame(args, [])
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event<:>\x03',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        shell: true,
        stdio: undefined,
        cwd: 'path',
      }, 'got expected options')

      t.end()
    })

    t.test('with a funky scriptShell', (t) => {
      const [cmd, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script "quoted parameter"; second command',
        scriptShell: 'blrpop',
      })
      t.equal(cmd, 'script "quoted parameter"; second command')
      t.strictSame(args, [])
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script "quoted parameter"; second command',
        },
        shell: 'blrpop',
        stdio: undefined,
        cwd: 'path',
      }, 'got expected options')

      t.end()
    })

    t.test('with cmd.exe as scriptShell', (t) => {
      const [cmd, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
        scriptShell: 'cmd.exe',
      })
      t.equal(cmd, 'script')
      t.strictSame(args, ['"quoted parameter";', 'second command'])
      t.hasStrict(opts, {
        env: {
          npm_package_json: 'C:\\Temp\\path\\package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        shell: 'cmd.exe',
        stdio: undefined,
        cwd: 'path',
      }, 'got expected options')

      t.end()
    })

    t.end()
  })
} else {
  t.test('posix', t => {
    t.test('simple script', (t) => {
      const [cmd, args, opts] = makeSpawnArgs({
        event: 'event',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(cmd, 'script')
      t.strictSame(args, ['"quoted parameter";', 'second command'])
      t.hasStrict(opts, {
        env: {
          npm_package_json: '/tmp/path/package.json',
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
        },
        shell: true,
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.end()
    })

    t.test('event with invalid characters runs', (t) => {
      const [cmd, args, opts] = makeSpawnArgs({
        event: 'event<:>/\x04',
        path: 'path',
        cmd: 'script',
        args: ['"quoted parameter";', 'second command'],
      })
      t.equal(cmd, 'script')
      t.strictSame(args, ['"quoted parameter";', 'second command'])
      t.hasStrict(opts, {
        env: {
          npm_package_json: '/tmp/path/package.json',
          npm_lifecycle_event: 'event<:>/\x04',
          npm_lifecycle_script: 'script',
        },
        shell: true,
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }, 'got expected options')

      t.end()
    })

    t.end()
  })
}
