'use strict';

const {app}             = require('electron'),
      {LauncherWindow}  = require('./windows'),
      path              = require('path');

const pkg = require(path.join(__dirname, '..', 'package.json'));

app.cwd = __dirname;
app.pkg = pkg;

app.once('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

let launcher;

app.once('ready', () => {
  
  // start running the actual app
  let launcher = new LauncherWindow();

});
