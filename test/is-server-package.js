const t = require('tap')
const isServerPackage = require('../lib/is-server-package.js')

t.test('returns true if server.js present', async t => {
  const path = t.testdir({
    'server.js': '',
  })
  t.equal(await isServerPackage(path), true)
})

t.test('returns false if server.js missing', async t => {
  const path = t.testdir({})
  t.equal(await isServerPackage(path), false)
})

t.test('returns false if server.js not a file', async t => {
  const path = t.testdir({
    'server.js': {}
  })
  t.equal(await isServerPackage(path), false)
})
