'use strict'

const uuid = require('uuid').v4

const childProcess = require('child_process')

exports = module.exports = class LauncherProfile {
  constructor (name = 'profile') {
    if (typeof name === 'object') {
      // deserializing
      Object.defineProperty(this, 'uuid', { value: name.uuid })
      Object.defineProperty(this, 'name', { value: name.name })
    } else {
      // creating new profile
      Object.defineProperty(this, 'uuid', { value: uuid() })
      Object.defineProperty(this, 'name', { value: name })
    }
  }

  launchGame () {

  }
}
