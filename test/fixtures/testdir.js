const fs = require('node:fs')
const path = require('node:path')

const SYMLINK = Symbol('symlink')
const LINK = Symbol('link')
const dirsToClean = []
let cleanupRegistered = false

function symlink (target) {
  return { [SYMLINK]: true, target }
}

function link (target) {
  return { [LINK]: true, target }
}

// Get the caller's file path (for Node versions where t.filePath isn't available)
// This can be removed once we no longer support Node version 20
function getCallerFile () {
  const originalPrepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack
  const err = new Error()
  const stack = err.stack
  Error.prepareStackTrace = originalPrepareStackTrace
  // stack[0] is getCallerFile, stack[1] is testdir, stack[2] is the caller
  const callerFile = stack[2]?.getFileName()
  return callerFile
}

// Sanitize test name for use in file paths (removes Windows-invalid characters)
function sanitizeTestName (name) {
  return name
    .split(' ').join('-')
    .replace(/[<>:"/\\|?*]/g, '_')
}

function testdir (testContext, structure = {}, options = {}) {
  registerCleanup()

  // Use t.filePath if available (Node 22.6+, 20.16+), otherwise get it from stack trace
  const callerFile = testContext.filePath || getCallerFile()
  const fixturePath = path.join(path.dirname(callerFile), 'testdir-' + sanitizeTestName(testContext.name))

  // Remove any existing fixture to avoid EEXIST errors
  fs.rmSync(fixturePath, { recursive: true, force: true })

  if (!options.saveFixture) {
    dirsToClean.push(fixturePath)
  }

  // If structure is a string or Buffer, create a file instead of a directory
  if (typeof structure === 'string' || Buffer.isBuffer(structure)) {
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true })
    fs.writeFileSync(fixturePath, structure)
    return fixturePath
  }

  // Create the temporary folder for testing
  fs.mkdirSync(fixturePath, { recursive: true })
  createStructure(fixturePath, structure)

  return fixturePath
}

function registerCleanup () {
  if (!cleanupRegistered) {
    cleanupRegistered = true
    process.on('exit', () => {
      for (const dir of dirsToClean) {
        try {
          fs.rmSync(dir, { recursive: true, force: true })
        } catch {
          // ignore cleanup errors
        }
      }
    })
  }
}

function createStructure (basePath, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = path.join(basePath, name)
    if (content && content[SYMLINK]) {
      // Symlink - target is relative to the symlink's location
      fs.symlinkSync(content.target, fullPath)
    } else if (content && content[LINK]) {
      // Hard link - target is relative to the link's location
      const targetPath = path.resolve(path.dirname(fullPath), content.target)
      fs.linkSync(targetPath, fullPath)
    } else if (Buffer.isBuffer(content)) {
      // Buffer content - write as binary file
      fs.writeFileSync(fullPath, content)
    } else if (typeof content === 'object' && content !== null) {
      fs.mkdirSync(fullPath, { recursive: true })
      createStructure(fullPath, content)
    } else {
      fs.writeFileSync(fullPath, content)
    }
  }
}

module.exports = testdir
module.exports.symlink = symlink
module.exports.link = link
