'use strict'

const { delimiter, sep, resolve, relative } = require('path')
const { createHash } = require('crypto')
const { mkdirSync, existsSync, realpathSync, symlinkSync } = require('fs')
const os = require('os')

const POSIX_DELIMITER = ':'

// Find the node_modules directory enclosing a bin path.
// e.g. `/a/b/node_modules/.bin/tsc` -> `/a/b/node_modules`
const modulesDirOf = (p) => {
  const parts = p.split(sep)
  const idx = parts.lastIndexOf('node_modules')
  /* istanbul ignore next -- defensive */
  if (idx === -1) {
    return null
  }
  /* istanbul ignore next -- defensive: only when path is exactly the fs root */
  return parts.slice(0, idx + 1).join(sep) || sep
}

// Build a bridge that maps tainted (PATH-delimiter-containing) node_modules
// bin paths to delimiter-free symlink mirrors so POSIX shells can resolve
// them via PATH. Returns a function (p) => mapped path. When bridging is not
// possible or not needed, the function returns its input unchanged.
//
// Only POSIX is bridged: Windows PATH delimiter is ';', and every absolute
// path there contains a drive-letter ':' which would false-positive if we
// treated ':' as the taint marker.
const createBinBridge = (projectPath, opts = {}) => {
  const {
    tmpdir = os.tmpdir(),
    // Injectable for tests only; defaults to the platform delimiter so the
    // win guess at which char breaks PATH on POSIX.
    delimiterForTaint = delimiter,
  } = opts

  // `delimiterForTaint` is the char that makes a PATH entry ambiguous. On
  // POSIX that is ':'. On Windows the delimiter is ';' and ':' appears in
  // drive letters, so only bridge when the two differ meaningfully. We
  // require POSIX semantics: '/' separator AND ':' marker.
  const isPosix = sep === '/' && delimiterForTaint === POSIX_DELIMITER
  if (!isPosix || tmpdir.includes(delimiterForTaint)) {
    return (p) => p
  }

  // Resolve the project path to a canonical real path when possible so the
  // bridge root is stable even when cwd is accessed via a symlink.
  let resolved
  try {
    resolved = realpathSync(projectPath)
  } catch {
    resolved = projectPath
  }

  const projectHash = createHash('sha256').update(resolved).digest('hex').slice(0, 16)
  /* istanbul ignore next -- defensive: every supported Node platform has getuid */
  const uid = typeof process.getuid === 'function' ? process.getuid() : 'user'
  const root = resolve(tmpdir, `npm-run-script-bridge-${uid}-${projectHash}`)

  // Lazily created on first bridged path; containers map is reused per call.
  let rootCreated = false
  const containers = new Map()

  const bridgeBinPath = (binPath) => {
    const nm = modulesDirOf(binPath)
    if (!nm || !nm.includes(delimiterForTaint)) {
      return binPath
    }

    // Lazily create the bridge root on first use.
    if (!rootCreated) {
      mkdirSync(root, { recursive: true, mode: 0o700 })
      rootCreated = true
    }

    let container = containers.get(nm)
    if (!container) {
      const nmHash = createHash('sha256').update(nm).digest('hex').slice(0, 16)
      container = resolve(root, nmHash)
      const bridgeNm = resolve(container, 'node_modules')
      if (!existsSync(bridgeNm)) {
        mkdirSync(container, { recursive: true, mode: 0o700 })
        /* istanbul ignore next -- defensive: only hit in a genuine parallel-process race */
        if (!existsSync(bridgeNm)) {
          symlinkSync(nm, bridgeNm)
        }
      }

      containers.set(nm, container)
    }

    // Reconstruct the relative portion (e.g. `.bin` or `.bin/tsc`) so the
    // bridge path preserves the same depth relationship inside the mirror.
    const rel = relative(nm, binPath)
    return resolve(container, 'node_modules', rel)
  }

  return bridgeBinPath
}

module.exports = createBinBridge
