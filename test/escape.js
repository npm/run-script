'use strict'

const { writeFileSync: writeFile, unlinkSync: unlink, chmodSync: chmod } = require('fs')
const { join } = require('path')
const t = require('tap')
const promiseSpawn = require('@npmcli/promise-spawn')

const escape = require('../lib/escape.js')
const isWindows = process.platform === 'win32'

t.test('sh', (t) => {
  const expectations = [
    ['', `''`],
    ['test', 'test'],
    ['test words', `'test words'`],
    ['$1', `'$1'`],
    ['"$1"', `'"$1"'`],
    [`'$1'`, `\\''$1'\\'`],
    ['\\$1', `'\\$1'`],
    ['--arg="$1"', `'--arg="$1"'`],
    ['--arg=npm exec -c "$1"', `'--arg=npm exec -c "$1"'`],
    [`--arg=npm exec -c '$1'`, `'--arg=npm exec -c '\\''$1'\\'`],
    [`'--arg=npm exec -c "$1"'`, `\\''--arg=npm exec -c "$1"'\\'`],
  ]

  for (const [input, expectation] of expectations) {
    t.equal(escape.sh(input), expectation,
      `expected to escape \`${input}\` to \`${expectation}\``)
  }

  t.test('integration', { skip: isWindows && 'posix only' }, async (t) => {
    const dir = t.testdir()

    for (const [input] of expectations) {
      const filename = join(dir, 'posix.sh')
      const script = `#!/usr/bin/env sh\nnode -p process.argv[1] -- ${escape.sh(input)}`
      writeFile(filename, script)
      chmod(filename, '0755')
      const p = await promiseSpawn('sh', ['-c', filename], { stdioString: true })
      const stdout = p.stdout.trim()
      t.equal(input, stdout, 'actual output matches input')
      unlink(filename)
    }

    t.end()
  })

  t.end()
})

t.test('cmd', (t) => {
  const expectations = [
    ['', '""'],
    ['test', 'test'],
    ['%PATH%', '%%PATH%%'],
    ['%PATH%', '%%PATH%%', true],
    ['"%PATH%"', '^"\\^"%%PATH%%\\^"^"'],
    ['"%PATH%"', '^^^"\\^^^"%%PATH%%\\^^^"^^^"', true],
    [`'%PATH%'`, `'%%PATH%%'`],
    [`'%PATH%'`, `'%%PATH%%'`, true],
    ['\\%PATH%', '\\%%PATH%%'],
    ['\\%PATH%', '\\%%PATH%%', true],
    ['--arg="%PATH%"', '^"--arg=\\^"%%PATH%%\\^"^"'],
    ['--arg="%PATH%"', '^^^"--arg=\\^^^"%%PATH%%\\^^^"^^^"', true],
    ['--arg=npm exec -c "%PATH%"', '^"--arg=npm exec -c \\^"%%PATH%%\\^"^"'],
    ['--arg=npm exec -c "%PATH%"', '^^^"--arg=npm exec -c \\^^^"%%PATH%%\\^^^"^^^"', true],
    [`--arg=npm exec -c '%PATH%'`, `^"--arg=npm exec -c '%%PATH%%'^"`],
    [`--arg=npm exec -c '%PATH%'`, `^^^"--arg=npm exec -c '%%PATH%%'^^^"`, true],
    [`'--arg=npm exec -c "%PATH%"'`, `^"'--arg=npm exec -c \\^"%%PATH%%\\^"'^"`],
    [`'--arg=npm exec -c "%PATH%"'`, `^^^"'--arg=npm exec -c \\^^^"%%PATH%%\\^^^"'^^^"`, true],
    ['"C:\\Program Files\\test.bat"', '^"\\^"C:\\Program Files\\test.bat\\^"^"'],
    ['"C:\\Program Files\\test.bat"', '^^^"\\^^^"C:\\Program Files\\test.bat\\^^^"^^^"', true],
    ['"C:\\Program Files\\test%.bat"', '^"\\^"C:\\Program Files\\test%%.bat\\^"^"'],
    ['"C:\\Program Files\\test%.bat"', '^^^"\\^^^"C:\\Program Files\\test%%.bat\\^^^"^^^"', true],
    ['% % %', '^"%% %% %%^"'],
    ['% % %', '^^^"%% %% %%^^^"', true],
    ['hello^^^^^^', 'hello^^^^^^^^^^^^'],
    ['hello^^^^^^', 'hello^^^^^^^^^^^^^^^^^^^^^^^^', true],
    ['hello world', '^"hello world^"'],
    ['hello world', '^^^"hello world^^^"', true],
    ['hello"world', '^"hello\\^"world^"'],
    ['hello"world', '^^^"hello\\^^^"world^^^"', true],
    ['hello""world', '^"hello\\^"\\^"world^"'],
    ['hello""world', '^^^"hello\\^^^"\\^^^"world^^^"', true],
    ['hello\\world', 'hello\\world'],
    ['hello\\world', 'hello\\world', true],
    ['hello\\\\world', 'hello\\\\world'],
    ['hello\\\\world', 'hello\\\\world', true],
    ['hello\\"world', '^"hello\\\\\\^"world^"'],
    ['hello\\"world', '^^^"hello\\\\\\^^^"world^^^"', true],
    ['hello\\\\"world', '^"hello\\\\\\\\\\^"world^"'],
    ['hello\\\\"world', '^^^"hello\\\\\\\\\\^^^"world^^^"', true],
    ['hello world\\', '^"hello world\\\\^"'],
    ['hello world\\', '^^^"hello world\\\\^^^"', true],
    ['hello %PATH%', '^"hello %%PATH%%^"'],
    ['hello %PATH%', '^^^"hello %%PATH%%^^^"', true],
  ]

  for (const [input, expectation, double] of expectations) {
    const msg = `expected to${double ? ' double' : ''} escape \`${input}\` to \`${expectation}\``
    t.equal(escape.cmd(input, double), expectation, msg)
  }

  t.test('integration', { skip: !isWindows && 'Windows only' }, async (t) => {
    const dir = t.testdir()

    for (const [input,, double] of expectations) {
      const filename = join(dir, 'win.cmd')
      if (double) {
        const shimFile = join(dir, 'shim.cmd')
        const shim = `@echo off\nnode -p process.argv[1] -- %*`
        writeFile(shimFile, shim)
        const script = `@echo off\n"${shimFile}" ${escape.cmd(input, double)}`
        writeFile(filename, script)
      } else {
        const script = `@echo off\nnode -p process.argv[1] -- ${escape.cmd(input)}`
        writeFile(filename, script)
      }
      const p = await promiseSpawn('cmd', ['/d', '/s', '/c', filename], { stdioString: true })
      const stdout = p.stdout.trim()
      t.equal(input, stdout, 'actual output matches input')
      unlink(filename)
    }

    t.end()
  })

  t.end()
})
