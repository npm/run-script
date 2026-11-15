const t = require('tap')
const { execFileSync } = require('child_process')
const { mkdirSync, writeFileSync, chmodSync, lstatSync } = require('fs')
const { delimiter, resolve, sep } = require('path')
const os = require('os')
const createBinBridge = require('../lib/bin-bridge.js')

t.test('bin-bridge', async t => {
  const isPosix = delimiter === ':'

  await t.test('returns identity when tmpdir contains the delimiter', async t => {
    const badTmp = `${os.tmpdir()}${sep}with${delimiter}${delimiter}colon`
    const bridge = createBinBridge('/some/clean/project', { tmpdir: badTmp })
    const tainted = '/a/b/node_modules/.bin/tsc'
    t.equal(bridge(tainted), tainted, 'tainted path returned unchanged when tmpdir is tainted')
  })

  await t.test('returns identity on a non-POSIX delimiter (simulated Windows)', async t => {
    // Force the marker to ';' to exercise the non-POSIX guard.
    const bridge = createBinBridge('/c:/some/project', { delimiterForTaint: ';' })
    const tainted = '/c:/project/node_modules/.bin/tsc'
    t.equal(bridge(tainted), tainted, 'non-posix path returned unchanged')
  })

  await t.test('returns identity when path has no delimiter', async t => {
    const bridge = createBinBridge('/some/clean/project')
    const clean = '/a/b/node_modules/.bin/tsc'
    t.equal(bridge(clean), clean, 'clean path returned unchanged')
  })

  await t.test('returns identity for non-node_modules paths', async t => {
    const bridge = createBinBridge('/some/clean/project')
    const random = '/a/b/bin/tsc'
    t.equal(bridge(random), random, 'non-node_modules path returned unchanged')
  })

  if (isPosix) {
    await t.test('bridges node_modules bin paths containing colon', async t => {
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-colon-' + process.pid, 'parent:directory', 'mono-repo')
      const nmDir = resolve(projectDir, 'node_modules')
      const binDir = resolve(nmDir, '.bin')
      mkdirSync(binDir, { recursive: true })

      const bridge = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      const tainted = resolve(nmDir, '.bin', 'tsc')
      const bridged = bridge(tainted)

      t.not(bridged, tainted, 'bridged path differs from input')
      t.ok(!bridged.includes(':'), 'bridged path is colon-free')

      // Verify the bridge symlink points to the real node_modules.
      const parts = bridged.split(sep)
      const nmIdx = parts.lastIndexOf('node_modules')
      const bridgeNm = parts.slice(0, nmIdx + 1).join(sep)
      t.ok(lstatSync(bridgeNm).isSymbolicLink(), 'bridge node_modules is a symlink')
    })

    await t.test('bridges a path that is exactly the node_modules dir', async t => {
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-exact-' + process.pid, 'parent:dir', 'mono')
      const nmDir = resolve(projectDir, 'node_modules')
      mkdirSync(nmDir, { recursive: true })

      const bridge = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      const bridged = bridge(resolve(nmDir))
      t.ok(!bridged.includes(':'), 'bridged node_modules path is colon-free')
      t.not(bridged, nmDir, 'bridged path differs from input')
    })

    await t.test('reuses existing bridge node_modules without re-symlinking', async t => {
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-reuse-' + process.pid, 'parent:dir', 'mono')
      const nmDir = resolve(projectDir, 'node_modules')
      mkdirSync(resolve(nmDir, '.bin'), { recursive: true })

      const bridge = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      bridge(resolve(nmDir, '.bin', 'a'))

      // Second bridge invocation over the same nm (maps to the same container).
      const bridge2 = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      const out = bridge2(resolve(nmDir, '.bin', 'b'))
      t.ok(!out.includes(':'), 'second bridge returns colon-free path')
    })

    await t.test('bridge preserves relative resolution for .bin bins', async t => {
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-resolve-' + process.pid, 'with:colon', 'mono-repo')
      const nmDir = resolve(projectDir, 'node_modules')
      const binDir = resolve(nmDir, '.bin')
      mkdirSync(binDir, { recursive: true })

      const binPath = resolve(binDir, 'tsc')
      writeFileSync(binPath, '#!/bin/sh\necho bridge-ok')
      chmodSync(binPath, 0o755)

      const bridge = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      const bridged = bridge(binPath)

      const out = execFileSync(bridged, { encoding: 'utf8' }).trim()
      t.equal(out, 'bridge-ok', 'bin executable through bridge path')
    })

    await t.test('deterministic: same nm always maps to same container', async t => {
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-dup-' + process.pid, 'dup:test', 'mono')
      const nmDir = resolve(projectDir, 'node_modules')
      mkdirSync(resolve(nmDir, '.bin'), { recursive: true })

      const bridge = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      const a1 = bridge(resolve(nmDir, '.bin', 'x'))
      const a2 = bridge(resolve(nmDir, '.bin', 'y'))
      const a3 = bridge(resolve(nmDir, '.bin', 'x'))
      const containerOf = (p) => p.slice(0, p.lastIndexOf('/'))
      t.equal(containerOf(a1), containerOf(a2), 'same node_modules maps to same container')
      t.equal(a1, a3, 'same input returns same output')
    })

    await t.test('integration: hoisted bin found via bridge in colon dir', async t => {
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-integration-' + process.pid, 'parent:dir', 'mono-repo')
      const nmDir = resolve(projectDir, 'node_modules')
      const binDir = resolve(nmDir, '.bin')
      const pkgDir = resolve(nmDir, 'typescript', 'bin')
      mkdirSync(pkgDir, { recursive: true })
      mkdirSync(binDir, { recursive: true })

      writeFileSync(resolve(pkgDir, 'tsc.js'), '#!/usr/bin/env node\nconsole.log("bridge-works")')
      chmodSync(resolve(pkgDir, 'tsc.js'), 0o755)
      writeFileSync(resolve(binDir, 'tsc'), '#!/bin/sh\nexec node "$(dirname "$0")/../typescript/bin/tsc.js"')
      chmodSync(resolve(binDir, 'tsc'), 0o755)

      const bridge = createBinBridge(projectDir, { tmpdir: bridgeRoot })
      const bridgedTsc = bridge(resolve(binDir, 'tsc'))

      const out = execFileSync(bridgedTsc, { encoding: 'utf8' }).trim()
      t.equal(out, 'bridge-works', 'script found and executed via bridge')
    })

    await t.test('setPATH applies bridge for colon-tainted walk-up paths', async t => {
      const setPATH = require('../lib/set-path.js')
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-setpath-' + process.pid, 'parent:dir', 'mono-repo')
      const nmDir = resolve(projectDir, 'node_modules')
      mkdirSync(resolve(nmDir, '.bin'), { recursive: true })

      const env = setPATH(projectDir, [], { PATH: '/usr/bin:/bin' }, { tmpdir: bridgeRoot })
      const pathEntries = env.PATH.split(delimiter)
      const bridgeEntry = pathEntries.find(e => e.includes('npm-run-script-bridge'))
      t.ok(bridgeEntry, 'PATH contains a bridge entry for the colon-tainted node_modules')
      t.ok(!bridgeEntry.includes(':'), 'bridge entry is colon-free')
      const rawEntry = pathEntries.find(e => e.includes('parent:dir'))
      t.notOk(rawEntry, 'PATH does not contain raw colon-tainted path')
    })

    await t.test('setPATH bridges tainted binPaths passed by caller', async t => {
      const setPATH = require('../lib/set-path.js')
      const bridgeRoot = t.testdir({})
      const projectDir = resolve(os.tmpdir(), 'npm-bridge-test-binpaths-' + process.pid, 'parent:dir')
      const binPaths = [`${projectDir}/node_modules/.bin`]

      const env = setPATH(projectDir, binPaths, { PATH: '/usr/bin:/bin' }, { tmpdir: bridgeRoot })
      const pathEntries = env.PATH.split(delimiter)
      const bridgeEntry = pathEntries.find(e => e.includes('npm-run-script-bridge') && e.endsWith('.bin'))
      t.ok(bridgeEntry, 'PATH contains bridge entry for tainted binPaths')
      const rawEntry = pathEntries.find(e => e.includes('parent:dir') && !e.includes('npm-run-script-bridge'))
      t.notOk(rawEntry, 'PATH does not contain raw tainted binPath')
    })
  }
})
