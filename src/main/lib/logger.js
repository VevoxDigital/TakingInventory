'use strict'

const winston = require('winston')

App.logger = new winston.Logger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
})
