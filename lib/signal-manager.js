const runningProcs = new Set()
let handlersInstalled = false

const forwardedSignals = [
  'SIGINT',
  'SIGTERM',
]

// no-op, this is so receiving the signal doesn't cause us to exit immediately
// instead, we exit after all children have exited when we re-send the signal
// to ourselves. see the catch handler at the bottom of run-script-pkg.js
const handleSignal = signal => {
  for (const proc of runningProcs) {
    proc.kill(signal)
  }
}

const setupListeners = () => {
  for (const signal of forwardedSignals) {
    process.on(signal, handleSignal)
  }
  handlersInstalled = true
}

const cleanupListeners = () => {
  if (runningProcs.size === 0) {
    for (const signal of forwardedSignals) {
      process.removeListener(signal, handleSignal)
    }
    handlersInstalled = false
  }
}

const add = proc => {
  runningProcs.add(proc)
  if (!handlersInstalled) {
    setupListeners()
  }

  const onEnd = () => {
    proc.removeListener('exit', onEnd)
    proc.removeListener('close', onEnd)
    runningProcs.delete(proc)
    cleanupListeners()
  }
  proc.once('exit', onEnd)
  // A failed spawn emits close without exit.
  proc.once('close', onEnd)
}

module.exports = {
  add,
  handleSignal,
  forwardedSignals,
}
