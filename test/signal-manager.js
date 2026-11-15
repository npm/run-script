const { EventEmitter } = require('events')
const { spawn } = require('child_process')
const { join } = require('path')
const { test } = require('tap')

const signalManager = require('../lib/signal-manager')

test('adds only one handler for each signal, removes handlers when children have exited', t => {
  const procOne = new EventEmitter()
  const procTwo = new EventEmitter()

  for (const signal of signalManager.forwardedSignals) {
    t.equal(
      process.listeners(signal).includes(signalManager.handleSignal),
      false, 'does not have a listener yet')
  }
  signalManager.add(procOne)

  for (const signal of signalManager.forwardedSignals) {
    t.equal(
      process.listeners(signal).includes(signalManager.handleSignal),
      true, 'has a listener for forwarded signals')
  }

  signalManager.add(procTwo)
  for (const signal of signalManager.forwardedSignals) {
    const handlers = process.listeners(signal).filter((fn) => fn === signalManager.handleSignal)
    t.equal(handlers.length, 1, 'only has one handler')
  }

  procOne.emit('exit', 0)

  for (const signal of signalManager.forwardedSignals) {
    t.equal(
      process.listeners(signal).includes(signalManager.handleSignal),
      true, 'did not remove listeners yet')
  }

  procTwo.emit('exit', 0)

  for (const signal of signalManager.forwardedSignals) {
    t.equal(
      process.listeners(signal).includes(signalManager.handleSignal),
      false, 'listener has been removed')
  }

  t.end()
})

test('forwards signals to child process', t => {
  const proc = new EventEmitter()
  proc.kill = (signal) => {
    t.equal(signal, signalManager.forwardedSignals[0], 'child receives correct signal')
    proc.emit('exit', 0)
    for (const forwarded of signalManager.forwardedSignals) {
      t.equal(
        process.listeners(forwarded).includes(signalManager.handleSignal),
        false, 'listener has been removed')
    }
    t.end()
  }

  signalManager.add(proc)
  // passing the signal name here is necessary to fake the effects of actually
  // receiving the signal per nodejs documentation signal handlers receive the
  // name of the signal as their first parameter
  // https://nodejs.org/api/process.html#process_signal_events
  process.emit(signalManager.forwardedSignals[0], signalManager.forwardedSignals[0])
})

test('removes handlers when a child fails to spawn', async t => {
  const proc = spawn(join(t.testdir({}), 'missing-command'), [], { stdio: 'ignore' })
  const error = new Promise(resolve => proc.once('error', resolve))
  const closed = new Promise(resolve => proc.once('close', resolve))
  t.teardown(() => proc.emit('exit', 1))
  signalManager.add(proc)

  t.match(await error, { code: 'ENOENT' })
  await closed

  for (const signal of signalManager.forwardedSignals) {
    t.equal(process.listeners(signal).includes(signalManager.handleSignal),
      false, 'listener has been removed after failed spawn')
  }
})

test('keeps forwarding signals while another child is running', t => {
  const failedProc = new EventEmitter()
  const runningProc = new EventEmitter()
  t.teardown(() => failedProc.emit('exit', 1))
  signalManager.add(failedProc)
  signalManager.add(runningProc)
  failedProc.emit('close', -1)

  for (const signal of signalManager.forwardedSignals) {
    t.equal(process.listeners(signal).includes(signalManager.handleSignal),
      true, 'still has a listener for the running child')
  }

  runningProc.emit('exit', 0)
  for (const signal of signalManager.forwardedSignals) {
    t.equal(process.listeners(signal).includes(signalManager.handleSignal),
      false, 'listener has been removed after the last child exits')
  }
  t.end()
})
