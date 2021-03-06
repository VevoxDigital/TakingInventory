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
    self.app = app;
    self.version = app.pkg.version;

    self.loadURL('file://' + path.join(app.cwd, 'launcher.html'));

    self.once('ready-to-show', () => {
      this.buildConfig().then(config => {
        app.logger.info(`launcher ready, loaded ${config.numProfiles} profile(s) [format ${config.format}]`);
        self.config = config;
        self.show();
      }).fail((err) => {
        app.logger.error('the launcher could not be initialized');
        app.createCrashDump(err, { phase: 'launch' });
      }).done();
    });
    self.once('close', () => {
      self.config.save().then(() => {
        app.quit();
      }).catch(app.logger.error).done();
    });

    self.logger = app.logger;
    self.config = null;
  }

  buildConfig () {
    return game.LauncherConfig.load().then(config => {
      let deferred = q.defer();

      game.versions().then(versions => {
        config.versions = versions;
        config.save();
        deferred.resolve(config);
      });

      return deferred.promise;
    });
  }

};
