'use strict';

const {app, BrowserWindow}  = require('electron');

const q     = require('q'),
      path  = require('path');

const game = require('../game');

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
      this.buildConfig().then(config => {
        app.logger.info(`launcher ready, loaded ${config.numProfiles} profiles [format ${config.format}]`);
        this.show();
      }).fail((err) => {
        app.logger.error('the launcher could not be initialized');
        app.createCrashDump(err, { phase: 'launch' });
      }).done();
    });
    self.once('close', () => { app.quit(); });

    self.logger = app.logger;
  }

  buildConfig () {
    return game.LauncherConfig.load().then(config => {
      let deferred = q.defer();

      game.versions().then(versions => {
        config.versions = versions;
        deferred.resolve(config);
      });

      return deferred.promise;
    });
  }

};
