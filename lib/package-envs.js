
const packageEnvs = (env, vals, prefix) => {
  for (const [key, val] of Object.entries(vals)) {
    if (val === undefined) {
      continue
    } else if (val === null || val === false) {
      env[`${prefix}${key}`] = ''
    } else if (Array.isArray(val)) {
      val.forEach((item, index) => {
        packageEnvs(env, { [`${key}_${index}`]: item }, `${prefix}`)
      })
    } else if (typeof val === 'object') {
      packageEnvs(env, val, `${prefix}${key}_`)
    } else {
      env[`${prefix}${key}`] = String(val)
    }
  }
  return env
}

// https://github.com/npm/rfcs/pull/183 defines which fields we put into the environment
module.exports = (env, pkg) => packageEnvs({ ...env }, {
  name: pkg.name,
  version: pkg.version,
  config: pkg.config,
  engines: pkg.engines,
  bin: pkg.bin,
}, 'npm_package_')
