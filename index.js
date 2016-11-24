'use strict';

const electron 	= require('electron'),
			path			= require('path'),
			app 			= electron.app;

const launcher = require('./src');

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 600,
		height: 400
	});

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('closed', onClosed);

	return win;
}

app.__rootdir = __dirname;
app.__dir = path.join(__dirname, 'src');

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

let createWindow = () => {
	if (!app.window) {
		app.window = launcher.init(app);
		app.window.on('closed', launcher.close);
	}
};
app.on('activate', () => { createWindow(); });
app.on('ready', () => { createWindow(); launcher.open(); });
