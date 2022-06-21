const t = require('tap')

const escape = require('../lib/escape.js')

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

  t.plan(expectations.length)
  for (const [input, expectation] of expectations) {
    t.equal(escape.sh(input), expectation,
      `expected to escape \`${input}\` to \`${expectation}\``)
  }
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

  t.plan(expectations.length)
  for (const [input, expectation, double] of expectations) {
    const msg = `expected to${double ? ' double' : ''} escape \`${input}\` to \`${expectation}\``
    t.equal(escape.cmd(input, double), expectation, msg)
  }
})
