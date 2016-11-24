'use strict';

const electron = require('electron');

let app;

exports.init = a => {
  app = a;

  let win = new electron.BrowserWindow({
    width: 1024,
    height: 600
  });

  win.loadURL(`file://${app.__rootdir}/index.html`);
  return win;
};

exports.open = () => {

};

exports.close = () => {

};
