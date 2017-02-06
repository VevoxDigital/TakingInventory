'use strict'

const _ = require('lodash')

const { app } = require('electron')

const enums = {
  LAUNCHER_VISIBILITY: [ 'HIDE', 'CLOSE', 'OPEN' ]
}

app.enum = { }
_.each(enums, (values, name) => {
  let enumValues = { }
  _.each(values, v => {
    enumValues[v] = v
  })
  app.enum[name] = enumValues
})
