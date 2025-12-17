const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert')
const testdir = require('./fixtures/testdir.js')
const spawk = require('spawk')
const runScript = require('..')

const isWindows = process.platform === 'win32'
let emptyDir

const pkill = process.kill

const output = []
const appendOutput = (level, ...args) => {
  if (level === 'standard') {
    output.push([...args])
  }
}

before((t) => {
  emptyDir = testdir(t, {})
  process.on('output', appendOutput)
})

afterEach(() => output.length = 0)

after(() => process.removeListener('output', appendOutput))

describe('run-script-pkg', () => {
  it('stdio inherit no args and a pkgid', async () => {
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
    assert.deepStrictEqual(output, [['\n> foo@1.2.3 foo\n> bar\n> baz\n']])
    assert.ok(spawk.done())
  })

  it('stdio inherit args and no pkgid', async () => {
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
    assert.deepStrictEqual(output, [['\n> foo\n> bar baz buzz\n']])
    assert.ok(spawk.done())
  })

  it('pkg has foo script, with stdio pipe', async () => {
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
    assert.deepStrictEqual(output, [])
    assert.ok(spawk.done())
  })

  it('pkg has foo script, with stdio pipe and args', async () => {
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
    assert.deepStrictEqual(output, [])
    assert.ok(spawk.done())
  })

  /* eslint-disable-next-line max-len */
  it('pkg has no install or preinstall script, node-gyp files present, stdio pipe', async (t) => {
    const dir = testdir(t, {
      'binding.gyp': 'exists',
    })

    spawk.spawn('sh', a => a.includes('node-gyp rebuild'))
    await runScript({
      event: 'install',
      path: dir,
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
    assert.deepStrictEqual(output, [])
    assert.ok(spawk.done())
  })

  it('pkg has no install or preinstall script, but gypfile:false, stdio pipe', async (t) => {
    const dir = testdir(t, {
      'binding.gyp': 'exists',
    })

    const res = await runScript({
      event: 'install',
      path: dir,
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
    assert.deepStrictEqual(output, [])
    assert.deepStrictEqual(res, { code: 0, signal: null })
  })

  it('end stdin if present', async () => {
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
    assert.ok(spawk.done())
    assert.ok(interceptor.calledWith.stdio[0].writableEnded, 'stdin was ended properly')
  })

  it('kill process when foreground process ends with signal, stdio inherit (first)', async () => {
    after(() => {
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
    await assert.rejects(runScript({
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
    assert.deepStrictEqual(output, [['\n> husky@1.2.3 sleep\n> sleep 1000000\n']])
    assert.ok(spawk.done())
    if (!isWindows) {
      assert.strictEqual(signal, 'SIGFOO', 'process.kill got expected signal')
      assert.strictEqual(pid, process.pid, 'process.kill got expected pid')
    }
  })

  it('kill process when foreground process ends with signal, stdio inherit (2)', async () => {
    after(() => {
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
    await assert.rejects(runScript({
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
    assert.deepStrictEqual(output, [['\n> husky@1.2.3 sleep\n> sleep 1000000\n']])
    assert.ok(spawk.done())
    if (!isWindows) {
      assert.strictEqual(signal, 'SIGFOO', 'process.kill got expected signal')
      assert.strictEqual(pid, process.pid, 'process.kill got expected pid')
    }
  })

  it('rejects if process.kill fails to end process, stdio inherit', async () => {
    after(() => {
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
    await assert.rejects(runScript({
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
    assert.deepStrictEqual(output, [['\n> husky@1.2.3 sleep\n> sleep 1000000\n']])
    assert.ok(spawk.done())
    if (!isWindows) {
      assert.strictEqual(signal, 'SIGFOO', 'process.kill got expected signal')
      assert.strictEqual(pid, process.pid, 'process.kill got expected pid')
    }
  })

  it('rejects if stdio is not inherit', async () => {
    spawk.spawn('sh', a => a.includes('sleep 1000000')).signal('SIGFOO')
    await assert.rejects(runScript({
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
    assert.deepStrictEqual(output, [])
    assert.ok(spawk.done())
  })
})
