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
      show: false,
      title: 'Taking Inventory'
    });

    let self = this;
    self.version = app.pkg.version;

    self.loadURL('file://' + path.join(app.cwd, 'launcher.html'));

    self.once('ready-to-show', () => {
      self.show();
      app.logger.info('launcher ready');
    });
    self.once('close', () => { app.quit(); });

    self.logger = app.logger;
  }

};
