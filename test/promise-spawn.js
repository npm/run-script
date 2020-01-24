const t = require('tap')
const requireInject = require('require-inject')
const Minipass = require('minipass')
const EE = require('events')
const fs = require('fs')

class MockProc extends EE {
  constructor (cmd, args, opts) {
    super()
    this.cmd = cmd
    this.args = args
    this.opts = opts
    this.stdout = opts.stdio === 'inherit' ? null : new Minipass()
    this.stderr = opts.stdio === 'inherit' ? null : new Minipass()
    this.code = null
    this.signal = null
    process.nextTick(() => this.run())
  }
  exit (code) {
    this.code = code
    this.emit('exit', this.code, this.signal)
    if (this.stdout && this.stderr) {
      let stdoutEnded = false
      let stderrEnded = false
      this.stdout.on('end', () => {
        stdoutEnded = true
        if (stderrEnded)
          this.emit('close', this.code, this.signal)
      })
      this.stderr.on('end', () => {
        stderrEnded = true
        if (stdoutEnded)
          this.emit('close', this.code, this.signal)
      })
      this.stdout.end()
      this.stderr.end()
    } else
      this.emit('close', this.code, this.signal)
  }
  kill (signal) {
    this.signal = signal
    this.exit(null)
  }

  writeOut (m) {
    this.stdout && this.stdout.write(m)
  }
  writeErr (m) {
    this.stderr && this.stderr.write(m)
  }

  run () {
    switch (this.cmd) {
      case 'not found':
        return this.emit('error', new Error('command not found'))
      case 'signal':
        this.writeOut('stdout')
        this.writeErr('stderr')
        return this.kill('SIGFAKE')
      case 'pass':
        this.writeOut('OK :)')
        return this.exit(0)
      case 'fail':
        this.writeOut('not ok :(')
        this.writeErr('Some kind of helpful error')
        return this.exit(1)
      case 'whoami':
        this.writeOut(`UID ${this.opts.uid}\n`)
        this.writeOut(`GID ${this.opts.gid}\n`)
        return this.exit(0)
    }
  }
}

const promiseSpawn = requireInject('../lib/promise-spawn.js', {
  child_process: {
    spawn: (cmd, args, opts) => new MockProc(cmd, args, opts),
  },
})

t.test('not found', t => t.rejects(promiseSpawn('not found', [], {}), {
  message: 'command not found',
}))

t.test('not found, with extra', t => t.rejects(promiseSpawn('not found', [], {}, {a: 1}), {
  message: 'command not found',
  stdout: Buffer.alloc(0),
  stderr: Buffer.alloc(0),
  a: 1,
}))

t.test('pass', t => t.resolveMatch(promiseSpawn('pass', [], {}, {a: 1}), {
  code: 0,
  signal: null,
  stdout: Buffer.from('OK :)'),
  stderr: Buffer.alloc(0),
  a: 1,
}))

t.test('pass, share stdio', t => t.resolveMatch(promiseSpawn('pass', [], { stdio: 'inherit'}, {a: 1}), {
  code: 0,
  signal: null,
  stdout: Buffer.alloc(0),
  stderr: Buffer.alloc(0),
  a: 1,
}))

t.test('fail', t => t.rejects(promiseSpawn('fail', [], {}, {a: 1}), {
  message: 'command failed',
  code: 1,
  signal: null,
  stdout: Buffer.from('not ok :('),
  stderr: Buffer.from('Some kind of helpful error'),
  a: 1,
}))

t.test('fail, shared stdio', t => t.rejects(promiseSpawn('fail', [], { stdio: 'inherit' }, {a: 1}), {
  message: 'command failed',
  code: 1,
  signal: null,
  stdout: Buffer.alloc(0),
  stderr: Buffer.alloc(0),
  a: 1,
}))

t.test('signal', t => t.rejects(promiseSpawn('signal', [], {}, {a: 1}), {
  message: 'command failed',
  code: null,
  signal: 'SIGFAKE',
  stdout: Buffer.from('stdout'),
  stderr: Buffer.from('stderr'),
  a: 1,
}))

t.test('infer ownership', t => {
  const {lstat} = fs
  t.teardown(() => fs.lstat = lstat)
  fs.lstat = (path, cb) => cb(null, { uid: 420, gid: 69 })
  const getuid = process.getuid
  t.teardown(() => process.getuid = getuid)

  t.test('as non-root, do not change uid/gid, regardless of arguments', t => {
    process.getuid = () => 1234
    return t.resolveMatch(promiseSpawn('whoami', [], { uid: 4321, gid: 9876 }), {
      code: 0,
      signal: null,
      stdout: Buffer.from('UID undefined\nGID undefined\n'),
      stderr: Buffer.alloc(0),
    })
  })

  t.test('as root, change uid/gid to folder, regardless of arguments', t => {
    process.getuid = () => 0
    return t.resolveMatch(promiseSpawn('whoami', [], { uid: 4321, gid: 9876 }), {
      code: 0,
      signal: null,
      stdout: Buffer.from('UID 420\nGID 69\n'),
      stderr: Buffer.alloc(0),
    })
  })

  t.end()
})
