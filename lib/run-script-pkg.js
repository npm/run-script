const pathModule = require('path')
const makeSpawnArgs = require('./make-spawn-args.js')
const promiseSpawn = require('@npmcli/promise-spawn')
const packageEnvs = require('./package-envs.js')
const { isNodeGypPackage, defaultGypInstallScript } = require('@npmcli/node-gyp')
const signalManager = require('./signal-manager.js')
const isServerPackage = require('./is-server-package.js')
const isWindows = require('./is-windows.js')
const { ShellString, unquoted } = require('puka');

const sh = (...args) =>
  ShellString.sh(...args).toString(process.env.__FAKE_TESTING_PLATFORM__ || process.platform)

// you wouldn't like me when I'm angry...
const bruce = (id, event, cmd) =>
  `\n> ${id ? id + ' ' : ''}${event}\n> ${cmd.trim().replace(/\n/g, '\n> ')}\n`

const runScriptPkg = async options => {
  const {
    event,
    path,
    scriptShell,
    env = {},
    stdio = 'pipe',
    pkg,
    args = [],
    stdioString = false,
    // note: only used when stdio:inherit
    banner = true,
    // how long to wait for a process.kill signal
    // only exposed here so that we can make the test go a bit faster.
    signalTimeout = 500,
  } = options

  const {scripts = {}, gypfile} = pkg
  let cmd = null
  if (options.cmd)
    cmd = options.cmd
  else if (pkg.scripts && pkg.scripts[event])
    cmd = sh`${unquoted(pkg.scripts[event])} ${args}`
  else if ( // If there is no preinstall or install script, default to rebuilding node-gyp packages.
    event === 'install' &&
    !scripts.install &&
    !scripts.preinstall &&
    gypfile !== false &&
    await isNodeGypPackage(path)
  )
    cmd = defaultGypInstallScript
  else if (event === 'start' && await isServerPackage(path))
    // `node` probably means `C:\Program Files\nodejs\node.exe`.
    // But it can also point to `.\node_modules\.bin\node.cmd` if you install a
    // Node.js version using `npm i node`.
    // So it might point to an executable, or a batch file. They require
    // different escaping. Also, `puka` only supports batch-style escaping.
    // The solution is to always use a batch file on Windows.
    cmd = isWindows
      ? sh`${pathModule.join(__dirname, 'node.cmd')} server.js ${args}`
      : sh`node server.js ${args}`

  if (!cmd)
    return { code: 0, signal: null }

  if (stdio === 'inherit' && banner !== false) {
    // we're dumping to the parent's stdout, so print the banner
    console.log(bruce(pkg._id, event, cmd))
  }

  const p = promiseSpawn(...makeSpawnArgs({
    event,
    path,
    scriptShell,
    env: packageEnvs(env, pkg),
    stdio,
    cmd,
    stdioString,
  }), {
    event,
    script: cmd,
    pkgid: pkg._id,
    path,
  })

  if (stdio === 'inherit')
    signalManager.add(p.process)

  if (p.stdin)
    p.stdin.end()

  return p.catch(er => {
    const { signal } = er
    if (stdio === 'inherit' && signal) {
      process.kill(process.pid, signal)
      // just in case we don't die, reject after 500ms
      // this also keeps the node process open long enough to actually
      // get the signal, rather than terminating gracefully.
      return new Promise((res, rej) => setTimeout(() => rej(er), signalTimeout))
    } else
      throw er
  })
}

module.exports = runScriptPkg
