'use strict'

// packages
const commandExists = require('command-exists')
const childProcess = require('child_process')

// constants
const JAVA_VERSION_PATTERN = /^java version "1\.([0-9])\.0_([0-9]+)/
const JAVA_VERSION_THRESHHOLD = 8

exports = module.exports = new Promise((resolve, reject) => {
  // check if java exists.
  // if not, reject with either the error or `undefined`
  commandExists('java', (err, exists) => {
    if (err || !exists) return reject(err)

    // actually run the version check
    // if an error occurs or there is no output, reject with such
    // also, why java outputs to stderr I don't know
    childProcess.exec('java -version', (err, info, out) => {
      if (err || !out) return reject(err)

      // we're looking for the version number and the revision (1.X.0_XXX)
      const version = JAVA_VERSION_PATTERN.exec(out)
      const versionInfo = {
        version: Number.parseInt(version[1], 10),
        revision: Number.parseInt(version[2], 10)
      }
      versionInfo.string = `${versionInfo.version}u${versionInfo.revision}`

      if (versionInfo.version < JAVA_VERSION_THRESHHOLD) reject(versionInfo)
      else resolve(versionInfo)
    })
  })
})
