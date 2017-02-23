'use strict'

const path = require('path')

require('colors')
global.App = require('electron').app

// globals
Object.defineProperty(App, 'root', { value: path.join(__dirname, '../..') })
Object.defineProperty(App, 'appdir', { value: App.getPath('userData') })
App.pkg = require(path.join(App.root, 'package.json'))

// load libs
require('./lib/logger')

// start init
App.logger.info(`${App.getName()} v${App.getVersion()} init start`)
App.logger.info(` ${'*'.cyan} using ${App.appdir} as install directory`)
