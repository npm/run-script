const t = require('tap')
const requireInject = require('require-inject')

let fakeIsNodeGypPackage = false

const runScriptPkg = requireInject('../lib/run-script-pkg.js', {
  '../lib/make-spawn-args.js': options => ['sh', ['-c', options.cmd], options],
  '@npmcli/promise-spawn': async (...args) => args,
  '@npmcli/node-gyp': {
    isNodeGypPackage: async(path) => Promise.resolve(fakeIsNodeGypPackage),
    defaultGypInstallScript: 'node-gyp rebuild'}
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

t.test('do the banner when stdio is inherited', t => {
  const logs = []
  const consoleLog = console.log
  console.log = (...args) => logs.push(args)
  t.teardown(() => console.log = consoleLog)
  return runScriptPkg({
    event: 'foo',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'inherit',
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
    stdio: 'inherit',
    cmd: 'bar',
  }, {
    event: 'foo',
    script: 'bar',
    pkgid: 'foo@1.2.3',
    path: 'path',
  }])).then(() => t.strictSame(logs, [['\n> foo@1.2.3 foo\n> bar\n']]))
})

t.test('do not show banner when stdio is inherited, if suppressed', t => {
  const logs = []
  const consoleLog = console.log
  console.log = (...args) => logs.push(args)
  t.teardown(() => console.log = consoleLog)
  return runScriptPkg({
    event: 'foo',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'inherit',
    cmd: 'bar',
    pkg: {
      _id: 'foo@1.2.3',
      scripts: {},
    },
    banner: false,
  }).then(res => t.strictSame(res, ['sh', ['-c', 'bar'], {
    stdioString: false,
    event: 'foo',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'inherit',
    cmd: 'bar',
  }, {
    event: 'foo',
    script: 'bar',
    pkgid: 'foo@1.2.3',
    path: 'path',
  }])).then(() => t.strictSame(logs, []))
})

t.test('do the banner with no pkgid', t => {
  const logs = []
  const consoleLog = console.log
  console.log = (...args) => logs.push(args)
  t.teardown(() => console.log = consoleLog)
  return runScriptPkg({
    event: 'foo',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'inherit',
    cmd: 'bar',
    pkg: {
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
    stdio: 'inherit',
    cmd: 'bar',
  }, {
    event: 'foo',
    script: 'bar',
    path: 'path',
    pkgid: undefined,
  }])).then(() => t.strictSame(logs, [['\n> foo\n> bar\n']]))
})

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

t.test('pkg has no install or preinstall script, but node-gyp files are present', async t => {
  fakeIsNodeGypPackage = true

  const res = await runScriptPkg({
    event: 'install',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'pipe',
    pkg: {
      _id: 'foo@1.2.3',
      scripts: {
      },
    }
  })

  t.strictSame(res, [
    'sh',
    [ '-c', 'node-gyp rebuild' ],
    {
      event: 'install',
      path: 'path',
      scriptShell: 'sh',
      env: { environ: 'value' },
      stdio: 'pipe',
      cmd: 'node-gyp rebuild',
      stdioString: false
    },
    {
      event: 'install',
      script: 'node-gyp rebuild',
      pkgid: 'foo@1.2.3',
      path: 'path'
    }
  ])
})

t.test('pkg has no install or preinstall script, but gypfile:false', async t => {
  fakeIsNodeGypPackage = true

  const res = await runScriptPkg({
    event: 'install',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'pipe',
    pkg: {
      _id: 'foo@1.2.3',
      gypfile: false,
      scripts: {
      },
    }
  })

  t.strictSame(res, { code: 0, signal: null })
})

t.test('end stdin if present', async t => {
  let stdinEnded = false
  const runScriptPkg = requireInject('../lib/run-script-pkg.js', {
    '../lib/make-spawn-args.js': options => ['sh', ['-c', options.cmd], options],
    '@npmcli/promise-spawn': (...args) => {
      const p = Promise.resolve(args)
      p.stdin = { end: () => stdinEnded = true }
      return p
    },
  })
  await t.resolveMatch(runScriptPkg({
    event: 'cat',
    path: 'path',
    stdin: { end: () => t.end() },
    pkg: {
      _id: 'kitty@1.2.3',
      scripts: {
        cat: 'cat',
      },
    },
  }), ['sh', ['-c', 'cat'], {
    event: 'cat',
    path: 'path',
    scriptShell: undefined,
    env: {},
    stdio: 'pipe',
    cmd: 'cat',
    stdioString: false,
  }, {
    event: 'cat',
    script: 'cat',
    pkgid: 'kitty@1.2.3',
    path: 'path',
  }])
  t.equal(stdinEnded, true, 'stdin was ended properly')
})
