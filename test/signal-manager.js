const { EventEmitter } = require('events')
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
