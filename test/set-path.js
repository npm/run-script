const t = require('tap')
const { resolve, delimiter } = require('path').posix

const setPATH = t.mock('../lib/set-path.js', {
  // Always use posix path functions so tests are consistent
  path: require('path').posix,
})

const paths = [
  '/x/y/z/node_modules/a/node_modules/b/node_modules/.bin',
  '/x/y/z/node_modules/a/node_modules/node_modules/.bin',
  '/x/y/z/node_modules/a/node_modules/.bin',
  '/x/y/z/node_modules/node_modules/.bin',
  '/x/y/z/node_modules/.bin',
  '/x/y/node_modules/.bin',
  '/x/node_modules/.bin',
  '/node_modules/.bin',
  resolve(__dirname, '../lib/node-gyp-bin'),
  '/usr/local/bin',
  '/usr/local/sbin',
  '/usr/bin',
  '/usr/sbin',
  '/bin',
  '/sbin',
]
t.test('no binPaths', async t => {
  const projectPath = '/x/y/z/node_modules/a/node_modules/b'
  t.strictSame(setPATH(projectPath, false, {
    foo: 'bar',
    PATH: '/usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin:/bin:/sbin',
  }), {
    foo: 'bar',
    PATH: paths.join(delimiter),
  })
})

t.test('binPaths end up at beginning of PATH', async t => {
  const projectPath = '/x/y/z/node_modules/a/node_modules/b'
  const binPaths = [
    '/q/r/s/node_modules/.bin',
    '/t/u/v/node_modules/.bin',
  ]
  t.strictSame(setPATH(projectPath, binPaths, {
    foo: 'bar',
    PATH: '/usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin:/bin:/sbin',
  }), {
    foo: 'bar',
    PATH: [
      ...binPaths,
      ...paths,
    ].join(delimiter),
  })
})
