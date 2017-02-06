'use strict'

const { app, BrowserWindow } = require('electron')
const path = require('path')

exports = module.exports = class SplashWindow extends BrowserWindow {
  constructor () {
    super({
      width: 250,
      height: 300,
      frame: false,
      resizable: false,
      fullscreenable: false,
      maximizeable: false,
      show: true,
      title: 'Taking Inventory',
      backgroundColor: '#333'
    })

    this.loadURL(`file://${path.join(app.appDir, 'views/splash.html')}`)
  }
}
