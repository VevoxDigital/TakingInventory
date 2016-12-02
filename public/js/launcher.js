'use strict';

const {remote} = require('electron');
window.$ = window.jQuery = require('jquery');
require('velocity-animate');

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

let win = remote.getCurrentWindow(), launcher;

win.on('show', () => {
  win.config.profileNames.forEach(name => {
    $('#profile').append(`<option value="${name}">${name}</option>`);
  });
  $('#profile').change(() => {
    win.config.profile = $('#profile').val();
    launcher.emit('profileChanged', win.config.profile);
  });
  $('#profile').val(win.config.profile.name);
  launcher.emit('profileChanged', win.config.profile);
});

$(() => {

  $('#windowClose').click(() => {
    win.close();
  });
  $('#windowMinimize').click(() => {
    win.minimize();
  });

  let modal = $('#modal');
  function toggleModal() {
    const dur = 200;
    if (modal.is(':visible')) {
      modal.velocity({
        opacity: 0
      }, { display: 'none', duration: dur });
    } else {
      modal.velocity({
         opacity: 1
      }, { display: 'block', duration: dur });
    }
  }
  function setModalContent(contentID) {
    modal.find('#modalForeground > .content').children().hide();
    modal.find('#modalForeground > .content > #' + contentID).show();
  }
  modal.find('#modalForeground > .close').click(() => {
    toggleModal();
  });

  function getFriendlyVersionName(vername) {
    if (vername.startsWith('b')) vername = 'Beta ' + vername.substring(1);
    else if (vername.startsWith('a')) vername = 'Alpha ' + vername.substring(1);
    else if (vername.startsWith('inf')) vername = 'InfDev';
    else if (vername.startsWith('c')) vername = 'Classic ' + vername.substring(1);
    else if (vername.startsWith('rd')) vername = 'Indev ' + vername.substring(3);
    return vername;
  }

  function updateLaunchButton(profile) {
    let button = $('#launch'),
      primary = button.find('.primary'),
      secondary = button.find('.secondary');

    let vername = getFriendlyVersionName(profile.version.id);

    if (profile) {
      win.logger.info('switched to profile: ' + profile.name);
      primary.html('Launch Minecraft');
      secondary.html(profile.name + ' - ' + vername);
      button.attr('title', 'Ready to Launch Minecraft ' + vername);
      button.removeAttr('disabled');
    } else {
      win.logger.info('switched to no profile');
      primary.html('Please Wait');
      secondary.html('Loading profile manifest, just a moment...');
      button.attr('title', 'Loading...');
      button.attr('disabled', '');
    }
  }

  launcher = new Launcher();
  launcher.on('profileChanged', profile => {
    updateLaunchButton(profile);
  });

  // TODO DEBUG Just tied the menu button to a mock profile for testing.
  $('#windowOptions').click(() => {
    launcher.activeProfile = launcher.activeProfile ? null : { name: 'Latest Official', version: '1.10.2' };
  });
  $('#footer .fa.fa-cog').click(() => {
    setModalContent('profiles');
    toggleModal();
  });

});
