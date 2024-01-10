const t = require('tap')
const spawk = require('spawk')
const runScript = require('..')

t.test('run-script', async t => {
  const emptyDir = t.testdir({})
  await t.test('no package provided, local package read', async t => {
    spawk.spawn(/.*/, a => a.includes('echo test'))
    const testdir = t.testdir({
      'package.json': JSON.stringify({
        name: '@npmcli/run-script-test-package',
        scripts: {
          test: 'echo test',
        },
      }),
    })
    await t.resolves(() => runScript({
      path: testdir,
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  await t.test('package provided, skip look up', async t => {
    spawk.spawn(/.*/, a => a.includes('echo test'))
    await t.resolves(() => runScript({
      pkg: {
        name: '@npmcli/run-script-test-package',
        scripts: {
          test: 'echo test',
        },
      },
      path: emptyDir,
      event: 'test',
    }))
    t.ok(spawk.done())
  })

  await t.test('non-install event, pkg has no scripts, early exit', async t => {
    const res = await runScript({
      event: 'foo',
      path: emptyDir,
      pkg: {},
    })
    t.strictSame(res, { code: 0, signal: null })
  })

  await t.test('non-install event, pkg does not have requested script', async t => {
    const res = await runScript({
      event: 'foo',
      path: emptyDir,
      pkg: {
        scripts: {},
      },
    })
    t.strictSame(res, { code: 0, signal: null })
  })

  await t.test('install event, pkg has no scripts, early exit', async t => {
    const res = await runScript({
      event: 'install',
      path: emptyDir,
      pkg: {},
    })
    t.strictSame(res, { code: 0, signal: null })
  })

  await t.test('start event, pkg has no scripts, no server.js', async t => {
    const res = await runScript({
      event: 'start',
      path: emptyDir,
      pkg: {},
    })
    t.strictSame(res, { code: 0, signal: null })
  })

  await t.test('start event, pkg has server.js but no start script', async t => {
    const path = t.testdir({ 'server.js': '' })
    spawk.spawn(/.*/, a => a.includes('node server.js'))
    const res = await runScript({
      event: 'start',
      path,
      pkg: {
        _id: '@npmcli/run-script-test@1.2.3',
        scripts: {},
      },
    })
    t.match(res, {
      event: 'start',
      script: 'node server.js',
      pkgid: '@npmcli/run-script-test@1.2.3',
    })
  })

  await t.test('pkg does not have requested script, with custom cmd', async t => {
    spawk.spawn(/.*/, a => a.includes('testcmd'))
    const res = await runScript({
      event: 'foo',
      cmd: 'testcmd',
      path: emptyDir,
      pkg: {
        scripts: {},
      },
    })
    t.match(res, {
      event: 'foo',
      script: 'testcmd',
      code: 0,
      signal: null,
    })
    t.ok(spawk.done())
  })
})

t.test('isServerPackage', async t => {
  await t.test('is server package', async t => {
    const testdir = t.testdir({
      'server.js': '',
    })
    await t.resolves(runScript.isServerPackage(testdir), true)
  })
  await t.test('is not server package - no server.js', async t => {
    const testdir = t.testdir({})
    await t.resolves(runScript.isServerPackage(testdir), false)
  })
  await t.test('is not server package - invalid server.js', async t => {
    const testdir = t.testdir({
      'server.js': {},
    })
    await t.resolves(runScript.isServerPackage(testdir), false)
  })
})
