'use strict';

const {app,BrowserWindow} = require('electron'),
      path                = require('path');

exports = module.exports = class SplashScreen extends BrowserWindow {
  constructor() {
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
    });

    this.logger = app.logger;

    this.loadURL('file://' + path.join(app.cwd, 'splash.html'));

    let self = this;
  }

};
