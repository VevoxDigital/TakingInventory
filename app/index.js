'use strict';

const {app}             = require('electron');
const {
  LauncherWindow,
  LauncherConsoleWindow,
  SplashScreen }  = require('./windows');
const path    = require('path'),
      winston = require('winston'),
      os      = require('os'),
      config  = require('nconf');
const game = require('./game');

const pkg = require(path.join(__dirname, '..', 'package.json'));

let splash, launcher, launcherConsole;

app.cwd = __dirname;
app.pkg = pkg;

config.argv()
  .env()
  .file({ file: path.join(__dirname, '..', 'config.json')})
  .defaults({
    launcher: {
      showConsole: false,
      gameDir: ''
    }
  });
app.on('quit', () => {
  config.save();
});
app.config = config;
app.game = game;

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

app.createCrashDump = (error, extra) => {
  if (!error) return;
  app.logger.error('a fatal error has been encountered during runtime');
  app.logger.error('please report this error to the developers on GitHub');

  let dump = 'Crash Report:<pre>';

  dump += 'System: ' + os.platform() + ' ' + os.arch() + ' ' + os.release() + '\n';
  dump += 'CPUs:';
  os.cpus().forEach(cpu => {
    dump += `\n    ${cpu.model} - ${cpu.speed}MHz`
  });

  if (extra) {
    dump += 'Extra Information:\n'
    for (const key in extra) {
      if (!extra.hasOwnProperty(key)) continue;
      dump += '    ' + key + ': ' + extra[key].toString();
    }
  }

  dump += '\nCallstack:\n  ' + error.stack.replace(/\(.+TakingInventory/g, '(.') + '</pre>';
  app.logger.error(dump);

  launcherConsole.show();
  splash.hide();
  launcher.hide();
  launcherConsole.on('close', () => {
    app.quit();
  });
};

app.once('window-all-closed', () => {
  app.logger.info('triggered window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});

app.once('quit', () => {
  app.logger.info('exiting per software request');
});

app.once('ready', () => {
  app.logger.info('app ready, launcher init start');

  process.on('uncaughtException', err => {
    app.createCrashDump(err);
  });
  process.on('SIGINT', () => {
    app.logger.info('recieved SIGINT');
    app.quit();
  });

  // pop up the splashscreen asap so the user has something to see
  splash = new SplashScreen();

  // start the console first
  launcherConsole = new LauncherConsoleWindow();
  app.logger.transports.launcher.window = launcherConsole;

  launcherConsole.once('ready-to-show', () => {

    // start running the actual app
    launcher = new LauncherWindow();
    launcher.once('show', () => {
      splash.close();
    });
  });
});
