/* eslint camelcase: "off" */
const setPATH = require('./set-path.js')
const { resolve } = require('path')

const makeSpawnArgs = options => {
  const {
    event,
    path,
    scriptShell = true,
    binPaths,
    env,
    stdio,
    cmd,
    args,
    stdioString,
    nodeGyp,
  } = options

  if (nodeGyp) {
    // npm already pulled this from env and passes it in to options
    npm_config_node_gyp = nodeGyp
  } else if (env.npm_config_node_gyp) {
    // legacy mode for standalone user
    npm_config_node_gyp = env.npm_config_node_gyp
  } else {
    // default
    npm_config_node_gyp = require.resolve('node-gyp/bin/node-gyp.js')
  }

  const spawnEnv = setPATH(path, binPaths, {
    // we need to at least save the PATH environment var
    ...process.env,
    ...env,
    npm_package_json: resolve(path, 'package.json'),
    npm_lifecycle_event: event,
    npm_lifecycle_script: cmd,
    npm_config_node_gyp,
  })

  const spawnOpts = {
    env: spawnEnv,
    stdioString,
    stdio,
    cwd: path,
    shell: scriptShell,
  }

  return [cmd, args, spawnOpts]
}

module.exports = makeSpawnArgs
