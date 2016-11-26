'use strict';

const {remote} = require('electron');
window.$ = window.jQuery = require('jquery');

class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(label, cb) {
    if (!this.listeners.has(label))
      this.listeners.set(label, { on: [], once: [] });
    this.listeners.get(label).on.push(cb);
  }

  once(label, cb) {
    if (!this.listeners.has(label))
      this.listeners.set(label, { on: [], once: [] });
    this.listeners.get(label).once.push(cb);
  }

  emit(label) {
    let callbacks = this.listeners.get(label) || { on: [], once: [] };
    callbacks.on.forEach(cb => cb.apply(null, Array.prototype.slice.call(arguments, 1)));
    callbacks.once.forEach(cb => cb.apply(null, Array.prototype.slice.call(arguments, 1)));
    callbacks.once = [];
    this.listeners.set(label, callbacks);
  }

}

class Launcher extends EventEmitter {

  launch() {
    this.emit('gameLaunched');
  }

  get activeProfile() {
    return this.$activeProfile;
  }

  set activeProfile(profile) {
    if (profile) this.$activeProfile = profile;
    else delete this.$activeProfile;
    this.emit('profileChanged', this.$activeProfile);
  }

}

let launcher;

$(() => {

  $('#windowClose').click(() => {
    remote.getCurrentWindow().close();
  });
  $('#windowMinimize').click(() => {
    remote.getCurrentWindow().minimize();
  });

  function updateLaunchButton(profile) {
    let button = $('#launch'),
      primary = button.find('.primary'),
      secondary = button.find('.secondary');
    if (profile) {
      primary.html('Launch Minecraft');
      secondary.html(profile.name + ' - ' + profile.version);
      button.attr('title', 'Ready to Launch Minecraft ' + profile.version);
      button.removeAttr('disabled');
    } else {
      primary.html('Please Wait');
      secondary.html('Loading profile manifest, just a moment...');
      button.attr('title', 'Loading...');
      button.attr('disabled', '');
    }
  }
  updateLaunchButton();

  launcher = new Launcher();
  launcher.on('profileChanged', profile => {
    updateLaunchButton(profile);
  });

  // TODO DEBUG Just tied the menu button to a mock profile for testing.
  $('#windowOptions').click(() => {
    launcher.activeProfile = launcher.activeProfile ? null : { name: 'Latest Official', version: '1.10.2' };
  });

});
