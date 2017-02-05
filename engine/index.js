'use strict'

// packages

// electron
const { app, dialog } = require('electron')

process.on('SIGINT', () => {
  process.stdout.write('\nUser requested stop.\n')
  app.quit()
})

// set up the logger
app.logger = require('./logger')
app.logger.info('App init start')

app.once('quit', () => {
  app.logger.info('App closed')
})

app.once('ready', () => {
  // perform sanity checks
  app.logger.info('Performing sanity checks...')

  process.stdout.write(' * Java Version')

  require('./sanity/java').then(version => {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)

    process.stdout.write(` ✓ Java Version [${version.string} OK]\n`)
    app.emit('ready-sane')
  }, error => {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)

    if (error.revision) {
      process.stdout.write(` ! Java Version [${error.string} OUTDATED]\n`)
      app.logger.warn(`Java ${error.string} is below the recommended version.`)

      // prompt a skip-able warning about the old version
      dialog.showMessageBox({
        type: 'warning',
        buttons: [ 'Continue', 'Quit' ],
        cancelId: 1,
        title: 'TakingInventory: Java Warning',
        message: 'Your version of Java is outdated.',
        detail: 'Minecraft may run slowly or crash if Java is outdated. ' +
          'TakingInventory recommends at least Java 8, which can be downloaded from Java.com'
      }, button => {
        if (button === 1) return app.quit()

        app.logger.info('User overrode Java warning')
        app.emit('ready-sane')
      })
    } else {
      // prompt an error about missing Java, then quit.
      process.stdout.write(' ! Java Version [MISSING]')
      app.logger.error('Java is not installed, not in the path, or corrupt')
      app.logger.error(error || 'No further information available')
      app.quit()
      dialog.showErrorBox('Java Missing', 'Java is not installed and is required by Minecraft to run.')
    }
  })
})

app.on('ready-sane', () => {
  app.logger.info('All sanity checks passed, app will now start')
})
