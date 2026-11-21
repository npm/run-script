const setPATH = require('./set-path.js')
const { delimiter, join, resolve } = require('path')
const which = require('which')

let npmConfigNodeGyp

// quoting, variable expansion, escapes, command separators, pipes, redirection
// and grouping: anything that makes cmd.exe do more than start one program
const cmdSpecial = /["'%!^&|<>()\r\n]/

// cmd.exe runs these itself, even when a program of the same name is on the PATH
const cmdBuiltins = new Set([
  'assoc', 'break', 'call', 'cd', 'chdir', 'cls', 'color', 'copy', 'date', 'del',
  'dir', 'dpath', 'echo', 'endlocal', 'erase', 'exit', 'for', 'ftype', 'goto', 'if',
  'keys', 'md', 'mkdir', 'mklink', 'move', 'path', 'pause', 'popd', 'prompt', 'pushd',
  'rd', 'rem', 'ren', 'rename', 'rmdir', 'set', 'setlocal', 'shift', 'start', 'time',
  'title', 'type', 'ver', 'verify', 'vol',
])

const findInObject = (obj, key) => {
  key = key.toLowerCase()
  for (const objKey of Object.keys(obj).sort()) {
    if (objKey.toLowerCase() === key) {
      return obj[objKey]
    }
  }
}

// the program cmd.exe would start for `name`, if that is an .exe
const findWindowsExe = (name, cwd, env) => {
  // cmd.exe reads a forward slash as the start of a switch
  if (name.includes('/') || cmdBuiltins.has(name.toLowerCase().split(/[.\\:]/)[0])) {
    return null
  }
  let candidates
  if (/[\\:]/.test(name)) {
    candidates = [resolve(cwd, name)]
  } else {
    const dirs = (findInObject(env, 'PATH') || '').split(delimiter)
    // like cmd.exe, look in the current directory before the PATH
    if (findInObject(env, 'NoDefaultCurrentDirectoryInExePath') === undefined) {
      dirs.unshift(cwd)
    }
    candidates = dirs.filter(Boolean).map(dir => join(dir.replace(/^"(.*)"$/, '$1'), name))
  }
  const pathExt = findInObject(env, 'PATHEXT')
  for (const candidate of candidates) {
    const found = which.sync(candidate, { pathExt, nothrow: true })
    if (found) {
      return /\.exe$/i.test(found) ? found : null
    }
  }
  return null
}

// On Windows a script runs as `cmd.exe /d /s /c <script>`. When the script is
// one .exe with plain arguments, like `node server.js`, start the .exe directly,
// the way sh execs a lone command on other systems. The program is then npm's
// own child, so it stops when npm is stopped. Under cmd.exe it would outlive npm
// and keep its port or files open.
const directWindowsCommand = (cmd, args, env, cwd) => {
  const comSpec = process.env.ComSpec || 'cmd.exe'
  if (!/(?:^|\\)cmd(?:\.exe)?$/i.test(comSpec) ||
    cmdSpecial.test(cmd) || args.some(arg => cmdSpecial.test(arg))) {
    return null
  }
  const [name, ...words] = cmd.trim().split(/[ \t]+/)
  const exe = findWindowsExe(name, cwd, env)
  return exe && [exe, [...words, ...args]]
}

const makeSpawnArgs = options => {
  const {
    args,
    binPaths,
    cmd,
    env,
    event,
    nodeGyp,
    path,
    scriptShell = true,
    stdio,
    stdioString,
  } = options

  if (nodeGyp) {
    // npm already pulled this from env and passes it in to options
    npmConfigNodeGyp = nodeGyp
  } else if (env.npm_config_node_gyp) {
    // legacy mode for standalone user
    npmConfigNodeGyp = env.npm_config_node_gyp
  } else {
    // default
    npmConfigNodeGyp = require.resolve('node-gyp/bin/node-gyp.js')
  }

  const spawnEnv = setPATH(path, binPaths, {
    // we need to at least save the PATH environment var
    ...process.env,
    ...env,
    npm_package_json: resolve(path, 'package.json'),
    npm_lifecycle_event: event,
    npm_lifecycle_script: cmd,
    npm_config_node_gyp: npmConfigNodeGyp,
  })

  const spawnOpts = {
    env: spawnEnv,
    stdioString,
    stdio,
    cwd: path,
    shell: scriptShell,
  }

  if (process.platform === 'win32' && scriptShell === true) {
    const direct = directWindowsCommand(cmd, args, spawnEnv, path)
    if (direct) {
      return [direct[0], direct[1], { ...spawnOpts, shell: false }]
    }
  }

  return [cmd, args, spawnOpts]
}

module.exports = makeSpawnArgs
