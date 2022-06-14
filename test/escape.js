const t = require('tap')

const escape = require('../lib/escape.js')

t.test('sh', (t) => {
  t.test('returns empty quotes when input is empty', async (t) => {
    const input = ''
    const output = escape.sh(input)
    t.equal(output, `''`, 'returned empty single quotes')
  })

  t.test('returns plain string if quotes are not necessary', async (t) => {
    const input = 'test'
    const output = escape.sh(input)
    t.equal(output, input, 'returned plain string')
  })

  t.test('wraps in single quotes if special character is present', async (t) => {
    const input = 'test words'
    const output = escape.sh(input)
    t.equal(output, `'test words'`, 'wrapped in single quotes')
  })
  t.end()
})

t.test('cmd', (t) => {
  t.test('returns empty quotes when input is empty', async (t) => {
    const input = ''
    const output = escape.cmd(input)
    t.equal(output, '""', 'returned empty double quotes')
  })

  t.test('returns plain string if quotes are not necessary', async (t) => {
    const input = 'test'
    const output = escape.cmd(input)
    t.equal(output, input, 'returned plain string')
  })

  t.test('wraps in double quotes when necessary', async (t) => {
    const input = 'test words'
    const output = escape.cmd(input)
    t.equal(output, '^"test words^"', 'wrapped in double quotes')
  })

  t.test('doubles up backslashes at end of input', async (t) => {
    const input = 'one \\ two \\'
    const output = escape.cmd(input)
    t.equal(output, '^"one \\ two \\\\^"', 'doubles backslash at end of string')
  })

  t.test('doubles up backslashes immediately before a double quote', async (t) => {
    const input = 'one \\"'
    const output = escape.cmd(input)
    t.equal(output, '^"one \\\\\\^"^"', 'doubles backslash before double quote')
  })

  t.test('backslash escapes double quotes', async (t) => {
    const input = '"test"'
    const output = escape.cmd(input)
    t.equal(output, '^"\\^"test\\^"^"', 'escaped double quotes')
  })
  t.end()
})
