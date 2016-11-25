'use strict';

const {app, BrowserWindow}  = require('electron'),
      path                  = require('path');

exports = module.exports = class LauncherWindow extends BrowserWindow {

  constructor() {
    super({
      width: 1024,
      height: 600,
      frame: false,
      resizable: false,
      fullscreenable: false,
      maximizeable: false,
      title: `Taking Inventory v${app.pkg.version}`,
      backgroundColor: '#333'
    });

    let self = this;
    self.version = app.pkg.version;

    self.loadURL('file://' + path.join(app.cwd, 'launcher.html'));

    self.once('ready-to-show', () => { self.show(); });
    self.once('close', () => { app.quit(); });
  }

};
