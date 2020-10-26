const runningProcs = new Set()

const forwardedSignals = [
  'SIGINT',
  'SIGTERM'
]

function handleSignal (signal) {
  for (const proc of runningProcs) {
    proc.kill(signal)
  }
}

function setupListeners () {
  for (const signal of forwardedSignals) {
    if (!process.listeners(signal).includes(handleSignal)) {
      process.once(signal, handleSignal)
    }
  }
}

function cleanupListeners () {
  if (runningProcs.size === 0) {
    for (const signal of forwardedSignals) {
      process.removeListener(signal, handleSignal)
    }
  }
}

function add (proc) {
  runningProcs.add(proc)
  setupListeners()
  proc.once('exit', ({ code }) => {
    process.exitCode = process.exitCode || code
    runningProcs.delete(proc)
    cleanupListeners()
  })
}

module.exports = {
  add,
  handleSignal,
  forwardedSignals
}
