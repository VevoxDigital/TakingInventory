'use strict'

const path = require('path')

require('colors')
global.App = require('electron').app

// globals
Object.defineProperty(App, 'root', { value: path.join(__dirname, '../..') })
Object.defineProperty(App, 'appdir', { value: App.getPath('userData') })

// load libs
require('./lib/logger')

// start init
App.logger.info(`${App.getName()} v${App.getVersion()} init start`)
App.logger.info(` ${'*'.cyan} using ${App.appdir} as install directory`)

// TODO DEBUG
const assets = require('./assets')
assets.download('12f260fc1976f6dd688a211f1a906f956344abdd/1.11.2')
