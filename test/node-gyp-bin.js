const t = require('tap')

const {exec} = require('child_process')

const {delimiter, resolve, dirname} = require('path')
const PATH = [
  resolve(__dirname, '../lib/node-gyp-bin'),
  ...(process.env.PATH.split(delimiter))
].filter(p => !/\.bin/.test(p)).join(delimiter)

const expect = 'v' + require('node-gyp/package.json').version + '\n'

exec('node-gyp --version', { env: {
  npm_config_node_gyp: require.resolve('node-gyp/bin/node-gyp.js'),
  PATH,
}}, (er, stdout) =>
  t.equal(stdout, expect, 'should run expected node-gyp version'))
