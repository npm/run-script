const t = require('tap')
const validateOptions = require('../lib/validate-options.js')

const cases = [
  ['xyz', 'invalid options object provided to runScript'],
  [{}, 'valid event not provided to runScript'],
  [{ event: false }, 'valid event not provided to runScript'],
  [{ event: 'x' }, 'valid path not provided to runScript'],
  [{ event: 'x', path: true }, 'valid path not provided to runScript'],
  [{ event: 'x', path: 'x', scriptShell: 1 }, 'invalid scriptShell option provided to runScript'],
  [{ event: 'x', path: 'x', env: null }, 'invalid env option provided to runScript'],
  [{ event: 'x', path: 'x', stdio: null }, 'invalid stdio option provided to runScript'],
  [{ event: 'x', path: 'x', args: null }, 'invalid args option provided to runScript'],
  [{ event: 'x', path: 'x', args: [null] }, 'invalid args option provided to runScript'],
  [{ event: 'x', path: 'x', args: ['x'], cmd: 7 }, 'invalid cmd option provided to runScript'],
  [{ event: 'x', path: 'x', args: ['x'] }, null],
]

t.plan(cases.length)
cases.forEach(([options, message]) => {
  if (message) {
    t.throws(() => validateOptions(options), new TypeError(message))
  } else {
    t.doesNotThrow(() => validateOptions(options))
  }
})
