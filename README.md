# @npmcli/run-script

Run a lifecycle script for a package (descendant of npm-lifecycle)

## USAGE

```js
const runScript = require('@npmcli/run-script')

runScript({
  // required, the script to run
  event: 'install',

  // required, the folder where the package lives
  path: '/path/to/package/folder',

  // optional, default true, run preinstall/postinstall before/after this
  runPrePost: true,

  // optional, default true, inherit process.env
  inheritEnv: true

  // optional, defaults to /bin/sh on unix, or cmd.exe on windows
  scriptShell: '/bin/bash',

  // optional, additional environment variables to add
  // note that process.env IS inherited by default
  // Always set:
  // - npm_package_json The package.json file in the folder
  // - npm_lifecycle_event The event that this is being run for
  // - npm_lifecycle_script The script being run
  env: {
    npm_package_from: 'foo@bar',
    npm_package_resolved: 'https://registry.npmjs.org/foo/-/foo-1.2.3.tgz',
    npm_package_integrity: 'sha512-foobarbaz',
  },

  // defaults to 'pipe'.  Can also pass an array like you would to node's
  // exec or spawn functions.  Note that if it's anything other than
  // 'pipe' then the stdout/stderr values on the result will be missing.
  // npm cli sets this to 'inherit' for explicit run-scripts (test, etc.)
  // but leaves it as 'pipe' for install scripts that run in parallel.
  stdio: 'inherit',
})
  .then(({ code, signal, stdout, stderr }) => {
    // do something with the results
  })
  .catch(er => {
    // command did not work.
    // er is decorated with:
    // - code
    // - signal
    // - stdout
    // - stderr
    // - event
    // - script
  })
```

## API

Call the exported `runScript` function with an options object.

Returns a promise that resolves to the result of the execution.  Promise
rejects if the execution fails (exits non-zero) or has any other error.

### Options

- `path` Required.  The path to the package having its script run.
- `event` Required.  The event being executed.
- `runPrePost` Optional, default false.  Run the `before${event}` before
  the script, and the `after${event}` afterwards.
- `inheritEnv` Optional, default true.  Inherit the environment from
  `process.env`.
- `env` Optional, object of fields to add to the environment of the
  subprocess.  Note that process.env IS inherited by default These are
  always set:
  - `npm_package_json` The package.json file in the folder
  - `npm_lifecycle_event` The event that this is being run for
  - `npm_lifecycle_script` The script being run
- `scriptShell` Optional, defaults to `/bin/sh` on Unix, defaults to
  `env.comspec` or `cmd` on Windows.  Custom script to use to execute the
  command.
- `stdio` Optional, defaults to `'pipe'`.  The same as the `stdio` argument
  passed to `child_process` functions in Node.js.  Note that if a stdio
  output is set to anything other than `pipe`, it will not be present in
  the result/error object.

## Differences from [npm-lifecycle](https://github.com/npm/npm-lifecycle)

This is an implementation intended to be used to satisfy [RFC
90](https://github.com/npm/rfcs/pull/90) and [RFC
77](https://github.com/npm/rfcs/pull/77).

Apart from those behavior changes in npm v7, this is also just refresh of
the codebase, with modern coding techniques and better test coverage.

Functionally, this means:

- Output is not dumped to the top level process's stdio by default.
- Less stuff is put into the environment.
- It is not opinionated about logging.  (So, at least with the logging
  framework in npm v7.0 and before, the caller has to call
  `log.disableProgress()` and `log.enableProgress()` at the appropriate
  times, if necessary.)
