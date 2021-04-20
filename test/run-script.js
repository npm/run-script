const requireInject = require('require-inject')

const runScript = requireInject('../lib/run-script.js', {
  '../lib/run-script-pkg.js': async x => x,
  '../lib/validate-options.js': () => {},
  'read-package-json-fast': async x => x,
})

const t = require('tap')

t.test('no package provided, look up the package', t =>
  runScript({ path: 'foo' }).then(res => t.strictSame(res, {
    path: 'foo',
    pkg: 'foo/package.json',
  })))

t.test('package provided, skip look up', t =>
  runScript({ path: 'foo', pkg: 'bar' }).then(res => t.strictSame(res, {
    path: 'foo',
    pkg: 'bar',
  })))

t.type(runScript.isServerPackage, 'function', 'export isServerPackage fn')
