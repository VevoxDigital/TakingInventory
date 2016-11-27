'use strict';

const {app, BrowserWindow}  = require('electron');

const path  = require('path'),
      q     = require('q'),
      os    = require('os'),
      fs    = require('fs-extra'),
      https = require('https');

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
      this.buildManifests().then(() => {
        app.logger.info('launcher init complete');
        this.show();
      }).fail((err) => {
        app.logger.error('the launcher could not be initialized');
        app.createCrashDump(err, { phase: 'launch' });
      }).done();
    });
    self.once('close', () => { app.quit(); });

    self.logger = app.logger;
  }

  getGameDirectory() {
    switch (os.platform()) {
      case 'darwin':
        return path.join(os.homedir(), 'Library', 'Application Support', 'minecraft');
      case 'win32':
        return path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft');
      default:
        return path.join(os.homedir(), '.minecraft');
    }
  }

  downloadVersionManifest(versionsManifestFile) {
    let deferred = q.defer(),
        self = this;

    try {
      fs.removeSync(versionsManifestFile);
      app.logger.verbose('successfully removed pre-existing file');
    } catch (err) {
      app.logger.verbose(err.toString());
    }

    let versionsManifestFileStream = fs.createWriteStream(versionsManifestFile);
    let req = https.request({
      host: 'launchermeta.mojang.com',
      path: '/mc/game/version_manifest.json',
      timeout: 5000
    }, res => {
      let contents = '';
      app.logger.verbose('version manifest GET ' + res.statusCode);
      versionsManifestFileStream.on('error', err => {
        deferred.reject(err);
      });

      res.on('data', data => {
        contents += data.toString();
        versionsManifestFileStream.write(data);
      });

      res.on('end', () => {
        app.logger.info('downloaded manifest: length ' + contents.length);
        versionsManifestFileStream.end();
        versionsManifestFileStream.close();
        deferred.resolve(JSON.parse(contents));
      });
    });
    req.on('error', err => {
      console.log(err);
      deferred.reject(err);
    });
    req.end();

    return deferred.promise;
  }

  fetchOfficialVersionManifest() {
    let deferred = q.defer(),
        self = this;

    const gameDir = self.getGameDirectory();

    const versionsDir = path.join(gameDir, 'versions');
    fs.ensureDir(versionsDir, err => {
      if (err) return deferred.reject(err);

      let versionsManifestFile = path.join(versionsDir, 'version_manifest.json');
      fs.stat(versionsManifestFile, (err, stats) => {
        if (err) {
          app.logger.info('version manifest is missing and will download');
          deferred.resolve(self.downloadVersionManifest(versionsManifestFile));
        } else {
          app.logger.info('checking for updates...');
          fs.readFile(versionsManifestFile, (err, contents) => {
            if (err) return deferred.reject(err);

            let req = https.request({
              host: 'launchermeta.mojang.com',
              path: '/mc/game/version_manifest.json',
              method: 'HEAD'
            }, res => {
              let targetLength = parseInt(res.headers['content-length'], 10),
                  localLength = contents.length;
              app.logger.verbose(`target ${targetLength} vs source ${localLength}`);
              if (targetLength === localLength) {
                app.logger.info('no new updates, keeping local version');
                deferred.resolve(JSON.parse(contents));
              } else {
                app.logger.info('updates are available, downloading latest manifest...');
                setTimeout(() => {
                  deferred.resolve(self.downloadVersionManifest(versionsManifestFile));
                }, 1000);
              }
            });
            req.on('error', err => {
              deferred.reject(err);
            });
            req.end();
          });
        }
      });
    });

    return deferred.promise;
  }

  buildVersionManifest() {
    return this.fetchOfficialVersionManifest().then((official) => {
      let deferred = q.defer(),
          self = this;

      let versions = { latest: official.latest, versions: { } };
      official.versions.forEach(version => {
        versions.versions[version.id] = version;
      });

      fs.readdir(path.join(self.getGameDirectory(), 'versions'), (err, files) => {
        if (err) return deferred.reject(err);

        for (const id of files) {
          try {
            let file = path.join(self.getGameDirectory(), 'versions', file),
                stats = fs.statSync(file);
            // ignore files, as versions are always in directories
            if (stats.isDirectory() && !versions.versions[id]) {
              try {
                fs.statSync(path.join(file, id + '.json'));
                app.logger.verbose('found valid custom version: ' + id);
                versions.versions[id] = {
                  id: id,
                  type: 'custom'
                };
              } catch (e) {
                continue;
              }
            }
          } catch (e) {
            app.logger.verbose('failed to read version directory: ' + e.message);
            continue;
          }
        }
        app.logger.info(Object.keys(versions.versions).length + ' versions found (' +
          (Object.keys(versions.versions).length - official.versions.length) + ' custom)');

        deferred.resolve(versions);
      });

      return deferred.promise;
    });
  }

  buildProfileManifest(versions) {
    let deferred = q.defer(),
        self = this;

    deferred.resolve({
      profiles: { },
      versions: versions
    });

    return deferred.promise;
  }

  buildManifests () {
    return this.buildVersionManifest()
      .then(this.buildProfileManifest);
  }

};
