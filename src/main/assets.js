'use strict'

const assert = require('assert')
const path = require('path')
const https = require('https')
const fs = require('fs-extra')
const _ = require('lodash')
const os = require('os')
const crypto = require('crypto')

const q = require('q')

exports.url = 'https://launchermeta.mojang.com/mc/game/'
exports.dir = 'bin'

/**
  * @function fetchVersionInfo
  * Fetches the version info for a specific version.
  *
  * @param version The version to fetch
  * @return Promise A promise to fetch (or load cached copy)
  */
exports.fetchVersionInfo = version => {
  assert.ok(version.match(/^[a-z0-9]+\/[0-9a-z.]+$/), 'Manifest id is invalid')

  let id = version.split('/')[1]
  let dir = path.join(App.appdir, exports.dir, id)

  App.logger.info(`attempting to fetch version info for ${id}`)

  let deferred = q.defer()

  let infoUrl = exports.url + version + '.json'
  let infoPath = path.join(dir, 'version.json')

  function resolveLocalInfo () {
    fs.readFile(infoPath, deferred.makeNodeResolver())
  }

  App.logger.verbose(`req: GET ${infoUrl}`)

  fs.ensureDir(dir, err => {
    if (err) return deferred.reject(err)

    https.get(infoUrl, res => {
      App.logger.verbose(`version info ${id}: GET ${res.statusCode}`)
      if (res.statusCode === 200) {
        let body = ''

        res.setEncoding('utf8')
        res.on('data', c => { body += c })
        res.on('end', () => {
          fs.writeFile(infoPath, body, err => {
            if (err) {
              App.logger.warn('failed to write file to local cache')
              App.logger.warn(err.stack)
            }
            try {
              deferred.resolve(JSON.parse(body))
            } catch (e) {
              deferred.reject(e)
            }
          })
        })
      } else {
        App.logger.error(`got not-OK code ${res.statusCode} during info fetch`)
        resolveLocalInfo()
      }
    }).on('error', err => {
      App.logger.error('could not download version manifest')
      App.logger.error(err.stack)
      resolveLocalInfo()
    }).setTimeout(5000, () => {
      App.logger.error('timed out while fetching version info')
      resolveLocalInfo()
    })
  })

  return deferred.promise
}

const osTypeMap = {
  Linux: 'linux',
  Darwin: 'osx',
  'Windows_NT': 'windows'
}

/**
  * @function checkArtifactRules
  * Checks the rules in an artifact to see if the artifact shold be downloaded
  *
  * @param rules The rules
  * @return boolean True if should download, false otherwise.
  */
exports.checkArtifactRules = rules => {
  let allow = false
  _.each(rules, rule => {
    if (rule.os && rule.os.name === osTypeMap[os.type()]) allow = rule.action === 'allow'
  })
  return allow
}

exports.downloadLibrary = artifact => {
  let deferred = q.defer()

  let artifactPath = path.join(App.appdir, exports.dir, 'lib', artifact.path)

  https.get(artifact.url, res => {
    if (res.statusCode === 200) {
      try {
        let out = fs.createWriteStream(artifactPath)
        res.pipe(out)
        out.on('finish', () => {
          out.close(() => { deferred.resolve(true) })
        })
      } catch (e) {
        deferred.reject(e)
      }
    } else {
      App.logger.error(`got not-OK code ${res.statusCode}`)
      return deferred.reject()
    }
  }).on('error', err => {
    App.logger.error(`failed to download artifact`)
    App.logger.error(err.stack)
    return deferred.reject()
  }).setTimeout(5000, () => {
    App.logger.error(`library download timed out`)
    return deferred.reject()
  })

  return deferred.promise
}

exports.checkLibrary = artifact => {
  let deferred = q.defer()

  let artifactPath = path.join(App.appdir, exports.dir, 'lib', artifact.path)

  App.logger.verbose(`checking ${artifact.name}`)

  fs.ensureDir(path.dirname(artifactPath), err => {
    if (err) return deferred.reject(err)

    fs.readFile(artifactPath, (err, data) => {
      if (err) {
        if (!err.message.startsWith('ENOENT')) {
          App.logger.warning('could not read existing library artifact: ' + artifact.name)
          App.logger.warning(err.stack)
        }
        return deferred.resolve(exports.downloadLibrary(artifact))
      }

      // file is still present, check hash
      let hash = crypto.createHash('sha1').update(data).digest('hex')
      if (artifact.sha1 === hash) {
        // hash is ok
        deferred.resolve(false)
      } else {
        deferred.resolve(exports.downloadLibrary(artifact))
      }
    })
  })

  return deferred.promise
}

exports.download = manifest => {
  exports.fetchVersionInfo(manifest).then(info => {
    App.logger.info(`info fetch success, ${info.libraries.length} libraries to verify`)

    let totalLibs = 0
    let perc = 1
    function check (artifact) {
      return exports.checkLibrary(artifact).then(downloaded => {
        let percPrefix = `[${perc < 10 ? ('0' + perc++) : perc++}/${totalLibs}]`
        if (downloaded) App.logger.info(` ${percPrefix.bold} downloaded ${artifact.name}`)
        else App.logger.info(` ${percPrefix.bold} skipped ${artifact.name}, hash ok`)
      })
    }

    let fetchers = []
    _.each(info.libraries, (lib, i) => {
      if (!lib.rules || exports.checkArtifactRules(lib.rules)) {
        if (lib.downloads.artifact) {
          totalLibs++
          lib.downloads.artifact.name = lib.name
          fetchers.push(check(lib.downloads.artifact))
        }

        if (lib.natives && lib.downloads.classifiers) {
          totalLibs++
          let classifierName = lib.natives[osTypeMap[os.type()]]
          let target = lib.downloads.classifiers[classifierName]
          target.name = lib.name + '@' + classifierName
          fetchers.push(check(target))
        }
      }
    })

    q.all(fetchers).then(() => {
      console.log('success')
    }).catch(err => {
      App.logger.error('game could not be started')
      App.logger.error(err.stack)
    }).finally(() => {
      console.log('exit')
    }).done()

    // TODO real error handling
  }).catch(console.error).done()
}
