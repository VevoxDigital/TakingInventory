'use strict';

const path    = require('path'),
      q       = require('q'),
      os      = require('os'),
      fs      = require('fs-extra'),
      https   = require('https'),
      config  = require('nconf');

const {app} = require('electron');

const DIR_VERSIONS = 'versions';

const FILE_VERSIONS = 'version_manifest.json',
      FILE_PROFILES = 'profiles.json';


const LAUNCHER_PROFILE_FORMAT = 1;
exports.LauncherVisibility = {
  STAY_HIDDEN: 0,
  STAY_VISIBLE: 1,
  HIDE_THEN_SHOW: 2
};

exports.Profile = class Profile {
  static deserialize(input) {
    return new this(JSON.parse(input));
  }

  constructor(config, data) {
    this.config = config;
    if (typeof data === 'string') {
      this.name = data;
    } else if (typeof data === 'object') {
      if (!data.name) throw new Error('name property missing');
      this.name = data.name;
      this.$version = data.version;
      this.java = data.java;
      this.resolution = data.resolution;
      this.useCustom = data.useCustom;
      this.useExperimental = data.userExperimental;
      this.game = data.game;
    } else throw new Error('unknown constructor data');
  }

  get version() {
    if (!this.config.versions || this.$version === 'none') return;
    return this.config.versions.versions[
      this.$version || this.config.versions.latest[this.useExperimental ? 'snapshot' : 'release']
    ];
  }

  set version(ver) {
    this.$version = ver;
    if (ver === 'latest') delete this.$version;
  }

  serialize() {
    return {
      name: this.name,
      version: this.$version,
      java: this.java,
      resolution: this.resolution,
      useCustom: this.useCustom,
      useExperimental: this.useExperimental,
      game: this.game
    };
  }
};

exports.User = class User {
  constructor(json) {
    this.name = json.name;
    this.username = json.username;
    this.id = json.id;
    this.token = json.token;
    this.uuid = json.uuid;
  }
};
exports.LauncherConfig = class LauncherConfig {
  static deserialize(json) {
    return new this(JSON.parse(json));
  }

  static load() {
    let deferred = q.defer(),
        self = this;

    // try to load the profiles file
    let dir = exports.dir();
    fs.readFile(path.join(dir, FILE_PROFILES), (err, data) => {
      if (err) {
        app.logger.info('no launcher config found, probably a clean install');
        // TODO look for Mojang launcher config and import
        deferred.resolve(new self('Latest Official'));
      } else deferred.resolve(self.deserialize(data.toString()));
    });

    return deferred.promise;
  }

  constructor(data) { // eslint-disable-line
    this.profiles = { };
    this.versions = null;
    if (typeof data === 'object') {
      let ps = data.profiles || { };
      for (const p in ps) if (ps.hasOwnProperty(p))
        this.profiles[p] = new exports.Profile(this, ps[p]);
      this.profile = data.profile || Object.keys(this.profiles)[0];
    } else if (typeof data === 'string') {
      this.profiles[data] = new exports.Profile(this, data);
      this.profile = data;
    } else throw new Error('unknown data input');
  }

  get format() {
    return LAUNCHER_PROFILE_FORMAT;
  }

  set profile(profile) {
    if (!this.profiles[profile]) return;
    this.$profile = profile;
  }
  get profile() {
    return this.profiles[this.$profile];
  }

  updateProfileName(oldName, newName) {
    let profile = this.profiles[oldName];
    if (!profile) return;
    profile.name = newName;

    this.profiles[newName] = profile;
    delete this.profiles[oldName];

    // if current profile is undefined, we must have changed it.
    if (!this.profile) this.profile = newName;
  }

  get numProfiles() {
    return this.profileNames.length;
  }
  get profileNames() {
    return Object.keys(this.profiles);
  }

  serialize(spaces) {
    let ps = { };
    for (const p in this.profiles) if (this.profiles.hasOwnProperty(p))
      ps[p] = this.profiles[p].serialize();
    return {
      profiles: ps,
      profile: this.profile.name,
      format: this.format
    };
  }

  save() {
    let deferred = q.defer(),
        self = this;

    fs.writeFile(path.join(exports.dir(), FILE_PROFILES), JSON.stringify(self.serialize(), null, 2), err => {
      if (err) return deferred.reject(err);
      deferred.resolve();
    });

    return deferred.promise;
  }
};


exports.VersionType = {
  RELEASE:  'release',
  SNAPSHOT: 'snapshot',
  ALPHA:    'old_alpha',
  BETA:     'old_beta',
  CUSTOM:   'custom'
};
exports.VersionEntry = class VersionEntry {
  constructor(id = 'undefined', type = exports.VersionType.CUSTOM, url) {
    this.id = id;
    this.type = type;
    this.url = url;
  }

  /**
    * Determines if this VersionEntry has a downloadable jar
    * (i.e. entry.url is truthy)
    * @returns True if downloadable, false otherwise.
    */
  downloadable() {
    return !!this.url;
  }

  /**
    * Determines if this VersionEntry is of the given version type.
    * @returns True if version types match, false otherwise
    */
  is(versionType) {
    return this.type === versionType;
  }

  /**
    * Serializes this VersionEntry to json
    * @returns JSON
    */
  json() {
    return {
      id: this.id,
      type: this.type,
      url: this.url
    };
  }
};


/**
  * Returns an absolute path of the game directory on the given paltform.
  * If no platform is given, `os.platform()` is used.
  * @name game.dir
  * @param platform The OS platform.
  * @returns The game directory
  * @since 1.0.0
  */
exports.dir = (platform, ignoreDefault) => {
  if (!ignoreDefault && config.get('launcher:gameDir') !== '') return config.get('launcher:gameDir');
  switch (platform || os.platform()) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'minecraft');
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft');
    default:
      return path.join(os.homedir(), '.minecraft');
  }
}

/**
  * Downloads the current version manifest from Mojang, deleting
  * the existing manifest on disk.
  * @name game.downloadVersions
  * @returns The versions manifest that was downloaded.
  * @since 1.0.0
  */
exports.downloadVersions = versionsManifestFile => {
  let deferred = q.defer(),
      self = this;

  // remove the pre-existing file so the stream doesn't fail
  try {
    fs.removeSync(versionsManifestFile);
    app.logger.verbose('successfully removed pre-existing file');
  } catch (err) {
    app.logger.verbose(err.toString());
  }

  // create a write stream and make the request
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
    app.logger.warning('Error downloading version manifest: ' + err.message);
    app.logger.warning(err.stack);
    deferred.reject(err);
  });
  req.setTimeout(5000, () => {
    app.logger.warning('Timeout when downloading manifest. Assuming there was no update.');
    deferred.resolve(JSON.parse(fs.readFileSync(versionsManifestFile).toString()));
  });
  req.end();

  return deferred.promise;
};

/**
  * Fetches the contents of the offical version manifest on disk, downloading
  * the manifest if it differs from the server or is missing.
  * @name game.versionsOffical
  * @returns The offical versions
  * @since 1.0.0
  */
exports.versionsOffical = () => {
  let deferred = q.defer();

  // make sure the versions directory exists
  const versionsDir = path.join(exports.dir(), DIR_VERSIONS);
  fs.ensureDir(versionsDir, err => {
    if (err) return deferred.reject(err);

    // see if the version manifest exists
    let versionsManifestFile = path.join(versionsDir, FILE_VERSIONS);
    fs.stat(versionsManifestFile, (err, stats) => {
      if (err) {
        // manifest is missing, download it.
        app.logger.info('version manifest is missing and will download');
        deferred.resolve(exports.downloadVersionManifest(versionsManifestFile));
      } else {
        // existing manifest found, see if it needs updating
        app.logger.info('checking for updates...');
        fs.readFile(versionsManifestFile, (err, contents) => {
          if (err) return deferred.reject(err);

          // make a HEAD request to check 'content-length'
          let req = https.request({
            host: 'launchermeta.mojang.com',
            path: '/mc/game/version_manifest.json',
            method: 'HEAD'
          }, res => {
            let targetLength = parseInt(res.headers['content-length'], 10),
                localLength = contents.length;
            app.logger.verbose(`target ${targetLength} vs source ${localLength}`);

            // Redownload is length differs, otherwise return the contents
            if (targetLength === localLength) {
              app.logger.info('no new updates, keeping local version');
              deferred.resolve(JSON.parse(contents));
            } else {
              app.logger.info('updates are available, downloading latest manifest...');
              setTimeout(() => {
                // timeout to avoid throttling
                deferred.resolve(exports.downloadVersionManifest(versionsManifestFile));
              }, 1000);
            }
          });
          req.on('error', err => {
            app.logger.warn('error verifying version manifest: ' + err.message);
            app.logger.warn(err.stack);
            deferred.reject(err);
          });
          req.setTimeout(5000, () => {
            app.logger.warn('timeout when verifying manifest, assuming there was no update');
            deferred.resolve(JSON.parse(fs.readFileSync(versionsManifestFile).toString()));
          });
          req.end();
        });
      }
    });
  });

  return deferred.promise;
};

/**
  * Gets a list of all versions available to the client, including unofficial
  * @returns All available versions
  * @since 1.0.0
  */
exports.versions = () => {
  return exports.versionsOffical().then((official) => {
    let deferred = q.defer();

    let versions = { latest: official.latest, versions: { } };
    official.versions.forEach(version => {
      versions.versions[version.id] = new exports.VersionEntry(version.id, version.type, version.url);
    });

    // look through versions dir for non-official versions
    fs.readdir(path.join(exports.dir(), DIR_VERSIONS), (err, files) => {
      if (err) return deferred.reject(err);

      for (const id of files) {
        try {
          let file = path.join(exports.dir(), 'versions', file),
              stats = fs.statSync(file);
          // ignore non-directories and existing versions
          if (stats.isDirectory() && !versions.versions[id]) {
            try {
              fs.statSync(path.join(file, id + '.json'));
              app.logger.verbose('found valid custom version: ' + id);
              versions.versions[id] = new exports.VersionEntry(id, exports.VersionType.CUSTOM);
            } catch (e) { continue; }
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
};
