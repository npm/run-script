const testdir = require('./fixtures/testdir.js')
const { symlink, link } = require('./fixtures/testdir.js')
const { describe, it } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

describe('testdir', () => {
  describe('basic directory creation', () => {
    it('creates an empty directory', (t) => {
      const dir = testdir(t, {})
      assert.ok(dir, 'returns a path')
      assert.ok(fs.existsSync(dir), 'directory exists')
      assert.ok(fs.statSync(dir).isDirectory(), 'is a directory')
    })

    it('creates a directory with a single file', (t) => {
      const dir = testdir(t, { 'file.txt': 'content' })
      const filePath = path.join(dir, 'file.txt')
      assert.ok(fs.existsSync(filePath), 'file exists')
      assert.strictEqual(fs.readFileSync(filePath, 'utf8'), 'content')
    })

    it('creates a directory with multiple files', (t) => {
      const dir = testdir(t, {
        'file1.txt': 'content1',
        'file2.txt': 'content2',
        'file3.json': '{"key": "value"}',
      })
      assert.strictEqual(fs.readFileSync(path.join(dir, 'file1.txt'), 'utf8'), 'content1')
      assert.strictEqual(fs.readFileSync(path.join(dir, 'file2.txt'), 'utf8'), 'content2')
      assert.strictEqual(fs.readFileSync(path.join(dir, 'file3.json'), 'utf8'), '{"key": "value"}')
    })
  })

  describe('nested directory structure', () => {
    it('creates nested directories', (t) => {
      const dir = testdir(t, {
        subdir: {
          'nested.txt': 'nested content',
        },
      })
      const nestedPath = path.join(dir, 'subdir', 'nested.txt')
      assert.ok(fs.existsSync(nestedPath), 'nested file exists')
      assert.strictEqual(fs.readFileSync(nestedPath, 'utf8'), 'nested content')
    })

    it('creates deeply nested directories', (t) => {
      const dir = testdir(t, {
        level1: {
          level2: {
            level3: {
              'deep.txt': 'deep content',
            },
          },
        },
      })
      const deepPath = path.join(dir, 'level1', 'level2', 'level3', 'deep.txt')
      assert.ok(fs.existsSync(deepPath), 'deeply nested file exists')
      assert.strictEqual(fs.readFileSync(deepPath, 'utf8'), 'deep content')
    })

    it('creates empty nested directories', (t) => {
      const dir = testdir(t, {
        emptyDir: {},
      })
      const emptyDirPath = path.join(dir, 'emptyDir')
      assert.ok(fs.existsSync(emptyDirPath), 'empty directory exists')
      assert.ok(fs.statSync(emptyDirPath).isDirectory(), 'is a directory')
    })
  })

  describe('string as structure (file mode)', () => {
    it('creates a file instead of directory when structure is a string', (t) => {
      const file = testdir(t, 'file contents')
      assert.ok(fs.existsSync(file), 'file exists')
      assert.ok(fs.statSync(file).isFile(), 'is a file, not a directory')
      assert.strictEqual(fs.readFileSync(file, 'utf8'), 'file contents')
    })

    it('creates a file with empty string content', (t) => {
      const file = testdir(t, '')
      assert.ok(fs.existsSync(file), 'file exists')
      assert.strictEqual(fs.readFileSync(file, 'utf8'), '')
    })

    it('creates a file with multiline content', (t) => {
      const content = 'line1\nline2\nline3'
      const file = testdir(t, content)
      assert.strictEqual(fs.readFileSync(file, 'utf8'), content)
    })
  })

  describe('symlinks', () => {
    it('creates a symlink to a file', (t) => {
      const dir = testdir(t, {
        'target.txt': 'target content',
        'link.txt': symlink('target.txt'),
      })
      const linkPath = path.join(dir, 'link.txt')
      assert.ok(fs.lstatSync(linkPath).isSymbolicLink(), 'is a symlink')
      assert.strictEqual(fs.readFileSync(linkPath, 'utf8'), 'target content')
    })

    it('creates a symlink to a directory', (t) => {
      const dir = testdir(t, {
        targetDir: {
          'file.txt': 'content',
        },
        linkDir: symlink('targetDir'),
      })
      const linkPath = path.join(dir, 'linkDir')
      assert.ok(fs.lstatSync(linkPath).isSymbolicLink(), 'is a symlink')
      assert.strictEqual(
        fs.readFileSync(path.join(linkPath, 'file.txt'), 'utf8'),
        'content'
      )
    })

    it('creates a symlink with relative path going up directories', (t) => {
      const dir = testdir(t, {
        packages: {
          a: {
            'package.json': '{"name": "a"}',
          },
        },
        node_modules: {
          a: symlink('../packages/a'),
        },
      })
      const linkPath = path.join(dir, 'node_modules', 'a')
      assert.ok(fs.lstatSync(linkPath).isSymbolicLink(), 'is a symlink')
      assert.strictEqual(
        fs.readFileSync(path.join(linkPath, 'package.json'), 'utf8'),
        '{"name": "a"}'
      )
    })

    it('creates multiple symlinks in node_modules style', (t) => {
      const dir = testdir(t, {
        packages: {
          a: { 'index.js': 'module.exports = "a"' },
          b: { 'index.js': 'module.exports = "b"' },
          c: { 'index.js': 'module.exports = "c"' },
        },
        node_modules: {
          a: symlink('../packages/a'),
          b: symlink('../packages/b'),
          c: symlink('../packages/c'),
        },
      })
      for (const pkg of ['a', 'b', 'c']) {
        const linkPath = path.join(dir, 'node_modules', pkg)
        assert.ok(fs.lstatSync(linkPath).isSymbolicLink(), `${pkg} is a symlink`)
        assert.strictEqual(
          fs.readFileSync(path.join(linkPath, 'index.js'), 'utf8'),
          `module.exports = "${pkg}"`
        )
      }
    })
  })

  describe('hard links', () => {
    it('creates a hard link to a file', (t) => {
      const dir = testdir(t, {
        'target.txt': 'target content',
        'hardlink.txt': link('target.txt'),
      })
      const targetPath = path.join(dir, 'target.txt')
      const linkPath = path.join(dir, 'hardlink.txt')
      // Hard links are not symlinks
      assert.ok(!fs.lstatSync(linkPath).isSymbolicLink(), 'is not a symlink')
      assert.ok(fs.statSync(linkPath).isFile(), 'is a file')
      // Both have same content
      assert.strictEqual(fs.readFileSync(linkPath, 'utf8'), 'target content')
      // Hard links share the same inode
      assert.strictEqual(
        fs.statSync(targetPath).ino,
        fs.statSync(linkPath).ino,
        'same inode (hard link)'
      )
    })

    it('creates a hard link in nested directory', (t) => {
      const dir = testdir(t, {
        'original.txt': 'original content',
        subdir: {
          'link.txt': link('../original.txt'),
        },
      })
      const originalPath = path.join(dir, 'original.txt')
      const linkPath = path.join(dir, 'subdir', 'link.txt')
      assert.strictEqual(fs.readFileSync(linkPath, 'utf8'), 'original content')
      assert.strictEqual(
        fs.statSync(originalPath).ino,
        fs.statSync(linkPath).ino,
        'same inode (hard link)'
      )
    })
  })

  describe('complex structures', () => {
    it('creates a realistic package structure', (t) => {
      const dir = testdir(t, {
        'package.json': JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          dependencies: { lodash: '^4.0.0' },
        }),
        src: {
          'index.js': 'module.exports = {}',
          utils: {
            'helper.js': 'module.exports = { help: () => {} }',
          },
        },
        node_modules: {
          lodash: {
            'package.json': JSON.stringify({ name: 'lodash', version: '4.17.21' }),
            'index.js': 'module.exports = {}',
          },
        },
      })
      assert.ok(fs.existsSync(path.join(dir, 'package.json')))
      assert.ok(fs.existsSync(path.join(dir, 'src', 'index.js')))
      assert.ok(fs.existsSync(path.join(dir, 'src', 'utils', 'helper.js')))
      assert.ok(fs.existsSync(path.join(dir, 'node_modules', 'lodash', 'package.json')))
    })

    it('creates workspaces-style structure with symlinks', (t) => {
      const dir = testdir(t, {
        'package.json': JSON.stringify({
          name: 'workspaces-project',
          workspaces: ['packages/*'],
        }),
        packages: {
          a: {
            'package.json': JSON.stringify({ name: 'a', version: '1.0.0' }),
          },
          b: {
            'package.json': JSON.stringify({ name: 'b', version: '1.0.0' }),
          },
        },
        node_modules: {
          a: symlink('../packages/a'),
          b: symlink('../packages/b'),
        },
      })
      // Verify symlinks resolve correctly
      const aPkg = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', 'a', 'package.json'), 'utf8'))
      const bPkg = JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', 'b', 'package.json'), 'utf8'))
      assert.strictEqual(aPkg.name, 'a')
      assert.strictEqual(bPkg.name, 'b')
    })
  })

  describe('path generation', () => {
    it('generates unique paths based on test name', (t) => {
      const dir = testdir(t, {})
      assert.ok(dir.includes('testdir-'), 'path contains testdir prefix')
      assert.ok(dir.includes('generates-unique-paths'), 'path contains sanitized test name')
    })

    it('replaces spaces with dashes in path', (t) => {
      const dir = testdir(t, {})
      assert.ok(!dir.includes(' '), 'path has no spaces')
      assert.ok(dir.includes('replaces-spaces-with-dashes'), 'spaces replaced with dashes')
    })
  })

  describe('buffer content', () => {
    it('creates a file with Buffer content in structure', (t) => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff])
      const dir = testdir(t, {
        'binary.bin': binaryData,
      })
      const filePath = path.join(dir, 'binary.bin')
      assert.ok(fs.existsSync(filePath), 'file exists')
      const content = fs.readFileSync(filePath)
      assert.ok(Buffer.isBuffer(content), 'read content is a buffer')
      assert.deepStrictEqual(content, binaryData)
    })

    it('creates a file instead of directory when structure is a Buffer', (t) => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]) // PNG header bytes
      const file = testdir(t, binaryData)
      assert.ok(fs.existsSync(file), 'file exists')
      assert.ok(fs.statSync(file).isFile(), 'is a file, not a directory')
      const content = fs.readFileSync(file)
      assert.deepStrictEqual(content, binaryData)
    })

    it('creates mixed string and Buffer files', (t) => {
      const dir = testdir(t, {
        'text.txt': 'hello world',
        'binary.bin': Buffer.from([0xde, 0xad, 0xbe, 0xef]),
      })
      assert.strictEqual(fs.readFileSync(path.join(dir, 'text.txt'), 'utf8'), 'hello world')
      assert.deepStrictEqual(
        fs.readFileSync(path.join(dir, 'binary.bin')),
        Buffer.from([0xde, 0xad, 0xbe, 0xef])
      )
    })
  })
})
