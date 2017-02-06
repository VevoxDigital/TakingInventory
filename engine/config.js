'use strict'

const { app } = require('electron')

const config = require('nconf')
const path = require('path')

require('./globals')

app.dir = app.getPath('userData')
app.pkg = require('../package.json')
app.cwd = __dirname
app.appDir = path.join(app.cwd, '../app')

app.logger.info(`Using ${app.dir} as storage directory`)

config.argv().env().file({
  file: path.join(app.dir, 'launcher.json')
}).defaults({
  launcherState: app.enum.LAUNCHER_VISIBILITY.CLOSE,
  profiles: { },
  users: { }
})

app.config = config
