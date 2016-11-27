'use strict';

const {app}             = require('electron');
const {
  LauncherWindow,
  LauncherConsoleWindow,
  SplashScreen }  = require('./windows');
const path    = require('path'),
      winston = require('winston');

const pkg = require(path.join(__dirname, '..', 'package.json'));

app.cwd = __dirname;
app.pkg = pkg;

app.logger = new winston.Logger({
  level: 'debug',
  transports: [
    new winston.transports.Console({
      colorize: true
    }),
    new winston.transports.LauncherConsole({
      name: 'launcher',
      tabName: 'Launcher',
      level: 'info'
    })
  ]
});

app.once('window-all-closed', () => {
  app.logger.info('triggered window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});

let splash, launcher, launcherConsole;

app.once('ready', () => {
  app.logger.info('app ready, launcher init start');

  // pop up the splashscreen asap so the user has something to see
  splash = new SplashScreen();

  // start the console first
  launcherConsole = new LauncherConsoleWindow();
  app.logger.transports.launcher.window = launcherConsole;

  launcherConsole.once('show', () => {

    // start running the actual app
    launcher = new LauncherWindow();
    launcher.once('show', () => {
      splash.close();
    });
  });
});
