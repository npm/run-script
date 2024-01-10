const t = require('tap')
const spawk = require('spawk')
const runScript = require('..')

const isWindows = process.platform === 'win32'
const emptyDir = t.testdir({})

const pkill = process.kill
const consoleLog = console.log

const mockConsole = t => {
  const logs = []
  console.log = (...args) => logs.push(args)
  t.teardown(() => console.log = consoleLog)
  return logs
}

t.test('run-script-pkg', async t => {
  await t.test('do the banner when stdio is inherited, handle line breaks', async t => {
    const logs = mockConsole(t)
    spawk.spawn('sh', a => a.includes('bar\nbaz\n'))
    await runScript({
      event: 'foo',
      path: emptyDir,
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
    })
    t.strictSame(logs, [['\n> foo@1.2.3 foo\n> bar\n> baz\n']])
    t.ok(spawk.done())
  })

  await t.test('do not show banner when stdio is inherited, if suppressed', async t => {
    const logs = mockConsole(t)
    spawk.spawn('sh', a => a.includes('bar'))
    await runScript({
      event: 'foo',
      path: emptyDir,
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
    })
    t.strictSame(logs, [])
    t.ok(spawk.done())
  })

  await t.test('do the banner with no pkgid', async t => {
    const logs = mockConsole(t)
    spawk.spawn('sh', a => a.includes('bar baz buzz'))
    await runScript({
      event: 'foo',
      path: emptyDir,
      scriptShell: 'sh',
      env: {
        environ: 'value',
      },
      stdio: 'inherit',
      cmd: 'bar',
      args: ['baz', 'buzz'],
      pkg: {
        scripts: {},
      },
    })
    t.strictSame(logs, [['\n> foo\n> bar baz buzz\n']])
    t.ok(spawk.done())
  })

  await t.test('pkg has foo script', async t => {
    const logs = mockConsole(t)
    spawk.spawn('sh', a => a.includes('bar'))
    await runScript({
      event: 'foo',
      path: emptyDir,
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
    })
    t.strictSame(logs, [])
    t.ok(spawk.done())
  })

  await t.test('pkg has foo script, with args', async t => {
    const logs = mockConsole(t)
    spawk.spawn('sh', a => a.includes('bar a b c'))
    await runScript({
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
      binPaths: false,
    })
    t.strictSame(logs, [])
    t.ok(spawk.done())
  })

  await t.test('pkg has no install or preinstall script, node-gyp files present', async t => {
    const testdir = t.testdir({
      'binding.gyp': 'exists',
    })

    const logs = mockConsole(t)
    spawk.spawn('sh', a => a.includes('node-gyp rebuild'))
    await runScript({
      event: 'install',
      path: testdir,
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
    t.strictSame(logs, [])
    t.ok(spawk.done())
  })

  t.test('pkg has no install or preinstall script, but gypfile:false', async t => {
    const testdir = t.testdir({
      'binding.gyp': 'exists',
    })

    const res = await runScript({
      event: 'install',
      path: testdir,
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
      },
    })
    t.strictSame(res, { code: 0, signal: null })
  })

  t.test('end stdin if present', async t => {
    const interceptor = spawk.spawn('sh', a => a.includes('cat'))
    await runScript({
      event: 'cat',
      path: emptyDir,
      scriptShell: 'sh',
      pkg: {
        _id: 'kitty@1.2.3',
        scripts: {
          cat: 'cat',
        },
      },
    })
    t.ok(spawk.done())
    t.ok(interceptor.calledWith.stdio[0].writableEnded, 'stdin was ended properly')
  })

  await t.test('kill process when foreground process ends with signal', async t => {
    t.teardown(() => {
      process.kill = pkill
    })
    let pid
    let signal
    process.kill = (p, s) => {
      pid = p
      signal = s
      // make the process.kill actually stop things
      throw new Error('process killed')
    }
    spawk.spawn('sh', a => a.includes('sleep 1000000')).signal('SIGFOO')
    await t.rejects(runScript({
      event: 'sleep',
      path: emptyDir,
      scriptShell: 'sh',
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
    }))
    t.ok(spawk.done())
    if (!isWindows) {
      t.equal(signal, 'SIGFOO', 'process.kill got expected signal')
      t.equal(pid, process.pid, 'process.kill got expected pid')
    }
  })

  await t.test('kill process when foreground process ends with signal', async t => {
    t.teardown(() => {
      process.kill = pkill
    })
    let pid
    let signal
    process.kill = (p, s) => {
      pid = p
      signal = s
      // make the process.kill actually stop things
      throw new Error('process killed')
    }
    spawk.spawn('sh', a => a.includes('sleep 1000000')).signal('SIGFOO')
    await t.rejects(runScript({
      event: 'sleep',
      path: emptyDir,
      scriptShell: 'sh',
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
    }))
    t.ok(spawk.done())
    if (!isWindows) {
      t.equal(signal, 'SIGFOO', 'process.kill got expected signal')
      t.equal(pid, process.pid, 'process.kill got expected pid')
    }
  })

  t.test('rejects if process.kill fails to end process', async t => {
    t.teardown(() => {
      process.kill = pkill
    })
    let pid
    let signal
    process.kill = (p, s) => {
      pid = p
      signal = s
      // do nothing here to emulate process.kill not killing the process
    }
    spawk.spawn('sh', a => a.includes('sleep 1000000')).signal('SIGFOO')
    await t.rejects(runScript({
      event: 'sleep',
      path: emptyDir,
      stdio: 'inherit',
      scriptShell: 'sh',
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
    }))
    t.ok(spawk.done())
    if (!isWindows) {
      t.equal(signal, 'SIGFOO', 'process.kill got expected signal')
      t.equal(pid, process.pid, 'process.kill got expected pid')
    }
  })

  t.test('rejects if stdio is not inherit', async t => {
    spawk.spawn('sh', a => a.includes('sleep 1000000')).signal('SIGFOO')
    await t.rejects(runScript({
      event: 'sleep',
      path: emptyDir,
      banner: false,
      scriptShell: 'sh',
      signalTimeout: 1,
      pkg: {
        _id: 'husky@1.2.3',
        name: 'husky',
        version: '1.2.3',
        scripts: {
          sleep: 'sleep 1000000',
        },
      },
    }))
    t.ok(spawk.done())
  })
})
