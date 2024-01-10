/* eslint-disable max-len */
const t = require('tap')
const runScript = require('..')

const cases = [
  ['no options', false, 'invalid options object provided to runScript'],
  ['not an object', 'xyz', 'invalid options object provided to runScript'],
  ['no event', {}, 'valid event not provided to runScript'],
  ['invalid event', { event: false }, 'valid event not provided to runScript'],
  ['no path', { event: 'x' }, 'valid path not provided to runScript'],
  ['invalid path', { event: 'x', path: true }, 'valid path not provided to runScript'],
  ['invalid scriptShell', { event: 'x', path: 'x', scriptShell: 1 }, 'invalid scriptShell option provided to runScript'],
  ['invalid env', { event: 'x', path: 'x', env: null }, 'invalid env option provided to runScript'],
  ['invalid stdio', { event: 'x', path: 'x', stdio: null }, 'invalid stdio option provided to runScript'],
  ['invalid args', { event: 'x', path: 'x', args: null }, 'invalid args option provided to runScript'],
  ['invalid single arg', { event: 'x', path: 'x', args: [null] }, 'invalid args option provided to runScript'],
  ['invalid cmd', { event: 'x', path: 'x', args: ['x'], cmd: 7 }, 'invalid cmd option provided to runScript'],
]

t.test('validate options error cases', async t => {
  for (const [name, options, message] of cases) {
    await t.test(name, async t => {
      await t.rejects(runScript(options), { name: 'TypeError', message })
    })
  }
})
