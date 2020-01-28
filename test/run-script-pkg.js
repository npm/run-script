const t = require('tap')
const requireInject = require('require-inject')
const runScriptPkg = requireInject('../lib/run-script-pkg.js', {
  '../lib/make-spawn-args.js': options => ['sh', ['-c', options.cmd], options],
  '../lib/promise-spawn.js': async (...args) => args,
})

t.test('pkg has no scripts, early exit', t => runScriptPkg({
  event: 'foo',
  pkg: {},
}).then(res => t.strictSame(res, { code: 0, signal: null })))

t.test('pkg has no foo script, early exit', t => runScriptPkg({
  event: 'foo',
  pkg: { scripts: {} },
}).then(res => t.strictSame(res, { code: 0, signal: null })))

t.test('pkg has no foo script, but custom cmd provided', t => runScriptPkg({
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  cmd: 'bar',
  pkg: {
    _id: 'foo@1.2.3',
    scripts: {},
  },
}).then(res => t.strictSame(res, ['sh', ['-c', 'bar'], {
  stdioString: false,
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  cmd: 'bar',
}, {
  event: 'foo',
  script: 'bar',
  pkgid: 'foo@1.2.3',
  path: 'path',
}])))

t.test('pkg has foo script', t => runScriptPkg({
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  pkg: {
    _id: 'foo@1.2.3',
    scripts: {
      foo: 'bar',
    },
  },
}).then(res => t.strictSame(res, ['sh', ['-c', 'bar'], {
  stdioString: false,
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  cmd: 'bar',
}, {
  event: 'foo',
  script: 'bar',
  pkgid: 'foo@1.2.3',
  path: 'path',
}])))

t.test('pkg has foo script, with args', t => runScriptPkg({
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  pkg: {
    _id: 'foo@1.2.3',
    scripts: {
      foo: 'bar',
    },
  },
  args: ['a', 'b', 'c'],
}).then(res => t.strictSame(res, ['sh', ['-c', 'bar "a" "b" "c"'], {
  stdioString: false,
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  cmd: 'bar "a" "b" "c"',
}, {
  event: 'foo',
  script: 'bar "a" "b" "c"',
  pkgid: 'foo@1.2.3',
  path: 'path',
}])))
