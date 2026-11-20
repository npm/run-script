const t = require('tap')
const spawk = require('spawk')
const realPromiseSpawn = require('@npmcli/promise-spawn')

const emptyDir = t.testdir({})

const mockRunScript = (t, { canExecve }) => {
  const calls = []
  const promiseSpawn = Object.assign((...args) => realPromiseSpawn(...args), {
    canExecve: () => canExecve,
    execve: async (...args) => {
      calls.push(args)
    },
  })
  const runScript = t.mock('../lib/run-script.js', {
    '../lib/run-script-pkg.js': t.mock('../lib/run-script-pkg.js', {
      '@npmcli/promise-spawn': promiseSpawn,
    }),
  })
  return { runScript, calls }
}

const options = (overrides) => ({
  event: 'npx',
  path: emptyDir,
  scriptShell: 'sh',
  stdio: 'inherit',
  cmd: 'bar',
  args: ['baz qux'],
  replaceProcess: true,
  pkg: { scripts: {} },
  ...overrides,
})

t.test('replaces the process when asked to and possible', async t => {
  const { runScript, calls } = mockRunScript(t, { canExecve: true })
  await runScript(options())
  t.equal(calls.length, 1)
  const [cmd, args, opts] = calls[0]
  t.equal(cmd, 'bar')
  t.strictSame(args, ['baz qux'])
  t.equal(opts.shell, 'sh')
  t.equal(opts.cwd, emptyDir)
  t.equal(opts.env.npm_lifecycle_event, 'npx')
  t.equal(opts.env.npm_lifecycle_script, 'bar')
})

t.test('spawns when execve is not available', async t => {
  const { runScript, calls } = mockRunScript(t, { canExecve: false })
  spawk.spawn('sh', a => a.includes("bar 'baz qux'"))
  await runScript(options())
  t.strictSame(calls, [])
  t.ok(spawk.done())
})

t.test('spawns when stdio is not inherited', async t => {
  const { runScript, calls } = mockRunScript(t, { canExecve: true })
  spawk.spawn('sh', a => a.includes("bar 'baz qux'"))
  await runScript(options({ stdio: 'pipe' }))
  t.strictSame(calls, [])
  t.ok(spawk.done())
})

t.test('spawns when not asked to replace the process', async t => {
  const { runScript, calls } = mockRunScript(t, { canExecve: true })
  spawk.spawn('sh', a => a.includes("bar 'baz qux'"))
  await runScript(options({ replaceProcess: false }))
  t.strictSame(calls, [])
  t.ok(spawk.done())
})
