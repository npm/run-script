const { EventEmitter } = require('events')
const t = require('tap')
const requireInject = require('require-inject')
const isWindows = require('../lib/is-windows.js')

let fakeIsNodeGypPackage = false
let SIGNAL = null
let EXIT_CODE = 0

const runScriptPkg = requireInject('../lib/run-script-pkg.js', {
  '../lib/make-spawn-args.js': options => ['sh', ['-c', options.cmd], options],
  '@npmcli/promise-spawn': (...args) => {
    const p = SIGNAL || EXIT_CODE
      ? Promise.reject(Object.assign(new Error('test command failed'), {
        signal: SIGNAL,
        code: EXIT_CODE,
      }))
      : Promise.resolve(args)
    p.process = new EventEmitter()
    return p
  },
  '@npmcli/node-gyp': {
    isNodeGypPackage: async(path) => Promise.resolve(fakeIsNodeGypPackage),
    defaultGypInstallScript: 'node-gyp rebuild'}
})

t.test('pkg has no scripts, early exit', t => runScriptPkg({
  event: 'foo',
  pkg: {},
}).then(res => t.strictSame(res, { code: 0, signal: null })))

t.test('pkg has no scripts, early exit', t => runScriptPkg({
  event: 'install',
  pkg: {},
}).then(res => t.strictSame(res, { code: 0, signal: null })))

t.test('pkg has no scripts, no server.js', t => runScriptPkg({
  event: 'start',
  pkg: {},
  path: t.testdir({}),
}).then(res => t.strictSame(res, { code: 0, signal: null })))

t.test('pkg has server.js, start not specified', async t => {
  const path = t.testdir({ 'server.js': '' })
  const res = await runScriptPkg({
    event: 'start',
    path,
    pkg: {
      name: 'foo',
      version: '1.2.3',
    },
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'pipe',
    pkg: {
      _id: 'foo@1.2.3',
      scripts: {},
    },
  })
  t.strictSame(res, ['sh', ['-c', 'node server.js'], {
    stdioString: false,
    event: 'start',
    path,
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'pipe',
    cmd: 'node server.js',
  }, {
    event: 'start',
    script: 'node server.js',
    pkgid: 'foo@1.2.3',
    path,
  }])
})

t.test('pkg has server.js, start not specified, with args', async t => {
  const path = t.testdir({ 'server.js': '' })
  const res = await runScriptPkg({
    event: 'start',
    path,
    pkg: {
      name: 'foo',
      version: '1.2.3',
    },
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    args: ['a', 'b', 'c'],
    stdio: 'pipe',
    pkg: {
      _id: 'foo@1.2.3',
      scripts: {},
    },
  })
  t.strictSame(res, ['sh', ['-c', 'node server.js a b c'], {
    stdioString: false,
    event: 'start',
    path,
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'pipe',
    cmd: 'node server.js a b c',
  }, {
    event: 'start',
    script: 'node server.js a b c',
    pkgid: 'foo@1.2.3',
    path,
  }])
})

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

t.test('do the banner when stdio is inherited, handle line breaks', t => {
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
    cmd: 'bar\nbaz\n',
    pkg: {
      _id: 'foo@1.2.3',
      scripts: {},
    },
  }).then(res => t.strictSame(res, ['sh', ['-c', 'bar\nbaz\n'], {
    stdioString: false,
    event: 'foo',
    path: 'path',
    scriptShell: 'sh',
    env: {
      environ: 'value',
    },
    stdio: 'inherit',
    cmd: 'bar\nbaz\n',
  }, {
    event: 'foo',
    script: 'bar\nbaz\n',
    pkgid: 'foo@1.2.3',
    path: 'path',
  }])).then(() => t.strictSame(logs, [['\n> foo@1.2.3 foo\n> bar\n> baz\n']]))
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

const expectedCommand = isWindows
  ? 'bar a --flag "markdown `code`" ^^^"$X^^^ \\\\\\^^^"blah\\\\\\^^^"^^^" $PWD ^^^%CD^^^% "^" ! \\ ">" "<" "|" "&" \' ^^^"\\^^^"^^^" ` "  " ""'
  : "bar a --flag 'markdown `code`' '$X \\\"blah\\\"' '$PWD' %CD% ^ ! '\\' '>' '<' '|' '&' \\' '\"' '`' '  ' ''"

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
  args: ['a', '--flag', 'markdown `code`', '$X \\"blah\\"', '$PWD', '%CD%', '^', '!', '\\', '>', '<', '|', '&', "'", '"', '`', '  ', ''],
}).then(res => t.strictSame(res, ['sh', ['-c', expectedCommand,], {
  stdioString: false,
  event: 'foo',
  path: 'path',
  scriptShell: 'sh',
  env: {
    environ: 'value',
  },
  stdio: 'pipe',
  cmd: expectedCommand,
}, {
  event: 'foo',
  script: expectedCommand,
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
      p.process = new EventEmitter()
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

t.test('kill process when foreground process ends with signal', t => {
  const { kill } = process.kill
  t.teardown(() => {
    process.kill = kill
    SIGNAL = null
  })
  process.kill = (pid, signal) => {
    t.equal(process.pid, pid, 'got expected pid')
    t.equal(signal, 'SIGFOO', 'got expected signal')
  }
  SIGNAL = 'SIGFOO'
  const p = runScriptPkg({
    event: 'sleep',
    path: 'path',
    stdio: 'inherit',
    banner: false,
    signalTimeout: 1,
    pkg: {
      _id: 'husky@1.2.3',
      name: 'husky',
      version: '1.2.3',
      scripts: {
        sleep: 'sleep 1000000',
      },
    },
  })
  p.catch(er => {
    t.equal(er.signal, 'SIGFOO')
    t.end()
  })
})

t.test('fail promise when background process ends with signal', t => {
  t.teardown(() => SIGNAL = null)
  SIGNAL = 'SIGBAR'
  const p = runScriptPkg({
    event: 'sleep',
    path: 'path',
    pkg: {
      _id: 'husky@1.2.3',
      name: 'husky',
      version: '1.2.3',
      scripts: {
        sleep: 'sleep 1000000',
      },
    },
  })
  p.catch(er => {
    t.equal(er.signal, 'SIGBAR')
    t.end()
  })
})
