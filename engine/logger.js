'use strict'

const winston = require('winston')

exports = module.exports = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      level: process.env['TI_USE_DEBUG'] ? 'debug' : 'verbose',
      colorize: true
    })
  ]
})
