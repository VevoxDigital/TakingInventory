'use strict';

const {app,BrowserWindow} = require('electron');
const {vsprintf} = require('sprintf-js');

const winston = require('winston'),
      path    = require('path'),
      moment  = require('moment');

winston.transports.LauncherConsole = class LauncherConsole extends winston.Transport {
  constructor (options = { }) { //eslint-disable-line
    super();
    this.name = options.name || 'LauncherConsole';
    this.tabName = options.tabName || '@' + new Date().getTime();

    this.level = options.level || 'info';
    this.unqiue = options.unqiue || false;
    this.silent = options.silent || false;
    this.formatter = options.formatter || this.format;
  }

  format (msg = '', meta = []) {
    return vsprintf(msg, meta);
  }

  log (level, msg = '', meta, cb) {
    if (!this.window) return;
    this.window.emit('launcher-output', {
      tab: {
        id: this.name,
        name: this.tabName
      },
      level: level,
      msg: this.formatter(msg, meta.args || []),
      time: moment()
    });
    cb();
  }
}

exports = module.exports = class LauncherConsoleWindow extends BrowserWindow {
  constructor(launcher) {
    super({
      width: 700,
      height: 400,
      x: 100,
      y: 50,
      fullscreenable: false,
      maximizeable: false,
      title: 'Taking Inventory',
      parent: launcher,
      show: false,
      backgroundColor: '#333'
    });

    let self = this;
    self.loadURL('file://' + path.join(app.cwd, 'console.html'));

    self.once('ready-to-show', () => {
      self.show();
      app.logger.info('console ready');
    });
  }
};
