const { describe, it } = require('node:test')
const assert = require('node:assert')
const testdir = require('./fixtures/testdir.js')
const spawk = require('spawk')
const runScript = require('..')

describe('run-script', () => {
  let emptyDir
  it('no package provided, local package read', async (t) => {
    spawk.spawn(/.*/, a => a.includes('echo test'))
    const dir = testdir(t, {
      'package.json': JSON.stringify({
        name: '@npmcli/run-script-test-package',
        scripts: {
          test: 'echo test',
        },
      }),
    })
    await runScript({
      path: dir,
      event: 'test',
    })
    assert.ok(spawk.done())
  })

  it('package provided, skip look up', async (t) => {
    emptyDir = testdir(t, {})
    spawk.spawn(/.*/, a => a.includes('echo test'))
    await runScript({
      pkg: {
        name: '@npmcli/run-script-test-package',
        scripts: {
          test: 'echo test',
        },
      },
      path: emptyDir,
      event: 'test',
    })
    assert.ok(spawk.done())
  })

  it('non-install event, pkg has no scripts, early exit', async () => {
    const res = await runScript({
      event: 'foo',
      path: emptyDir,
      pkg: {},
    })
    assert.deepStrictEqual(res, { code: 0, signal: null })
  })

  it('non-install event, pkg does not have requested script', async () => {
    const res = await runScript({
      event: 'foo',
      path: emptyDir,
      pkg: {
        scripts: {},
      },
    })
    assert.deepStrictEqual(res, { code: 0, signal: null })
  })

  it('install event, pkg has no scripts, early exit', async () => {
    const res = await runScript({
      event: 'install',
      path: emptyDir,
      pkg: {},
    })
    assert.deepStrictEqual(res, { code: 0, signal: null })
  })

  it('start event, pkg has no scripts, no server.js', async () => {
    const res = await runScript({
      event: 'start',
      path: emptyDir,
      pkg: {},
    })
    assert.deepStrictEqual(res, { code: 0, signal: null })
  })

  it('start event, pkg has server.js but no start script', async (t) => {
    const path = testdir(t, { 'server.js': '' })
    spawk.spawn(/.*/, a => a.includes('node server.js'))
    const res = await runScript({
      event: 'start',
      path,
      pkg: {
        _id: '@npmcli/run-script-test@1.2.3',
        scripts: {},
      },
    })
    assert.strictEqual(res.event, 'start')
    assert.strictEqual(res.script, 'node server.js')
    assert.strictEqual(res.pkgid, '@npmcli/run-script-test@1.2.3')
  })

  it('pkg does not have requested script, with custom cmd', async () => {
    spawk.spawn(/.*/, a => a.includes('testcmd'))
    const res = await runScript({
      event: 'foo',
      cmd: 'testcmd',
      path: emptyDir,
      pkg: {
        scripts: {},
      },
    })
    assert.strictEqual(res.event, 'foo')
    assert.strictEqual(res.script, 'testcmd')
    assert.strictEqual(res.code, 0)
    assert.strictEqual(res.signal ?? null, null)
    assert.ok(spawk.done())
  })
})

describe('isServerPackage', () => {
  it('is server package', async (t) => {
    const dir = testdir(t, {
      'server.js': '',
    })
    const result = await runScript.isServerPackage(dir)
    assert.strictEqual(result, true)
  })
  it('is not server package - no server.js', async (t) => {
    const dir = testdir(t, {})
    const result = await runScript.isServerPackage(dir)
    assert.strictEqual(result, false)
  })
  it('is not server package - invalid server.js', async (t) => {
    const dir = testdir(t, {
      'server.js': {},
    })
    const result = await runScript.isServerPackage(dir)
    assert.strictEqual(result, false)
  })
})
