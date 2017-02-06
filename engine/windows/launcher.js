'use strict'

const path = require('path')

const { app, BrowserWindow } = require('electron')

exports = module.exports = class LauncherWindow extends BrowserWindow {
  constructor () {
    super({
      width: 1024,
      height: 600,
      frame: false,
      resizable: false,
      fullscreenable: false,
      maximizeable: false,
      show: false,
      backgroundColor: '#333',
      title: `${app.pkg.productName} v${app.pkg.version}`
    })

    this.loadURL(`file://${path.join(app.appDir, 'views/launcher.html')}`)

    this.once('close', () => {
      app.config.save(err => {
        if (err) app.logger.error(err.stack)
        app.quit()
      })
    })
  }
}
