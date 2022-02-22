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

if (isWindows) {
  const setPATH = requireInject('../lib/set-path.js', {
    path: require('path').win32,
  })
  const expect = [
    'c:\\x\\y\\z\\node_modules\\a\\node_modules\\b\\node_modules\\.bin',
    'c:\\x\\y\\z\\node_modules\\a\\node_modules\\node_modules\\.bin',
    'c:\\x\\y\\z\\node_modules\\a\\node_modules\\.bin',
    'c:\\x\\y\\z\\node_modules\\node_modules\\.bin',
    'c:\\x\\y\\z\\node_modules\\.bin',
    'c:\\x\\y\\node_modules\\.bin',
    'c:\\x\\node_modules\\.bin',
    'c:\\node_modules\\.bin',
    require('path').win32.resolve(__dirname, '../lib/node-gyp-bin'),
    'c:\\usr\\local\\bin',
    'c:\\usr\\local\\sbin',
    'c:\\usr\\bin',
    'c:\\usr\\sbin',
    'c:\\bin',
    'c:\\sbin',
  ].join(';')
  t.strictSame(setPATH('c:\\x\\y\\z\\node_modules\\a\\node_modules\\b', {
    foo: 'bar',
    PATH: 'c:\\usr\\local\\bin;c:\\usr\\local\\sbin',
    Path: 'c:\\usr\\local\\bin;c:\\usr\\bin;c:\\usr\\sbin;c:\\bin;c:\\sbin',
  }), {
    foo: 'bar',
    PATH: expect,
    Path: expect,
  })
} else {
  const setPATH = requireInject('../lib/set-path.js', {
    path: require('path').posix,
  })
  t.strictSame(setPATH('/x/y/z/node_modules/a/node_modules/b', {
    foo: 'bar',
    PATH: '/usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin:/bin:/sbin',
  }), {
    foo: 'bar',
    PATH:
      '/x/y/z/node_modules/a/node_modules/b/node_modules/.bin:' +
      '/x/y/z/node_modules/a/node_modules/node_modules/.bin:' +
      '/x/y/z/node_modules/a/node_modules/.bin:' +
      '/x/y/z/node_modules/node_modules/.bin:' +
      '/x/y/z/node_modules/.bin:' +
      '/x/y/node_modules/.bin:' +
      '/x/node_modules/.bin:' +
      '/node_modules/.bin:' +
      require('path').posix.resolve(__dirname, '../lib/node-gyp-bin') + ':' +
      '/usr/local/bin:' +
      '/usr/local/sbin:' +
      '/usr/bin:' +
      '/usr/sbin:' +
      '/bin:' +
      '/sbin',
  })
}
