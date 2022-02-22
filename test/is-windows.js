const t = require('tap')
const isWindows = require('../lib/is-windows.js')

if (!process.env.__FAKE_TESTING_PLATFORM__) {
  t.equal(isWindows, process.platform === 'win32', 'actual')
  const fake = isWindows ? 'unix' : 'win32'
  t.spawn(process.execPath, [__filename, fake], { env: {
    __FAKE_TESTING_PLATFORM__: fake,
  } })
} else {
  t.equal(isWindows, process.platform !== 'win32', 'fake')
}
