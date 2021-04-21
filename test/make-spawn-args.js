const t = require('tap')
const requireInject = require('require-inject')
const isWindows = require('../lib/is-windows.js')

if (!process.env.__FAKE_TESTING_PLATFORM__) {
  const fake = isWindows ? 'posix' : 'win32'
  t.spawn(process.execPath, [__filename, fake], { env: {
    ...process.env,
    __FAKE_TESTING_PLATFORM__: fake,
  }})
}

const makeSpawnArgs = requireInject('../lib/make-spawn-args.js', {
  path: require('path')[isWindows ? 'win32' : 'posix'],
})

if (isWindows) {
  t.test('windows', t => {
    // with no ComSpec
    delete process.env.ComSpec
    t.match(makeSpawnArgs({
      event: 'event',
      path: 'path',
      cmd: 'script "quoted parameter"; second command',
    }), [
      'cmd',
      [ '/d', '/s', '/c', `script \"quoted parameter\"; second command` ],
      {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script',
          npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }
    ])

    // with a funky ComSpec
    process.env.ComSpec = 'blrorp'
    t.match(makeSpawnArgs({
      event: 'event',
      path: 'path',
      cmd: 'script "quoted parameter"; second command',
    }), [
      'blrorp',
      [ '-c', `script "quoted parameter"; second command` ],
      {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script'
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }
    ])

    t.match(makeSpawnArgs({
      event: 'event',
      path: 'path',
      cmd: 'script "quoted parameter"; second command',
      scriptShell: 'cmd.exe',
    }), [
      'cmd.exe',
      [ '/d', '/s', '/c', `script \"quoted parameter\"; second command` ],
      {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script'
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }
    ])

    t.end()
  })

} else {

  t.test('posix', t => {
    t.match(makeSpawnArgs({
      event: 'event',
      path: 'path',
      cmd: 'script "quoted parameter"; second command',
    }), [
      'sh',
      [ '-c', `script "quoted parameter"; second command` ],
      {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script'
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: undefined,
      }
    ])

    // test that we can explicitly run in cmd.exe, even on posix systems
    // relevant for running under WSL
    t.match(makeSpawnArgs({
      event: 'event',
      path: 'path',
      cmd: 'script "quoted parameter"; second command',
      scriptShell: 'cmd.exe',
    }), [
      'cmd.exe',
      [ '/d', '/s', '/c', `script \"quoted parameter\"; second command` ],
      {
        env: {
          npm_package_json: /package\.json$/,
          npm_lifecycle_event: 'event',
          npm_lifecycle_script: 'script'
        },
        stdio: undefined,
        cwd: 'path',
        windowsVerbatimArguments: true,
      }
    ])

    t.end()
  })
}
