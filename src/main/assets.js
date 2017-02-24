'use strict'

const assert = require('assert')
const path = require('path')
const https = require('https')
const fs = require('fs-extra')

const q = require('q')

exports.url = 'https://launchermeta.mojang.com/mc/game/'
exports.dir = 'asset'

/**
  * @function fetchVersionInfo
  * Fetches the version info for a specific version.
  *
  * @param version The version to fetch
  * @return Promise A promise to fetch (or load cached copy)
  */
exports.fetchVersionInfo = function (version) {
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

exports.download = manifest => {
  exports.fetchVersionInfo(manifest).then(info => {
    App.logger.info(`info fetch success, ${info.libraries.length} libraries to verify`)
  }).catch(console.error).done()
}
