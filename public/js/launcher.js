'use strict';

const {remote} = require('electron');
window.$ = window.jQuery = require('jquery');
require('velocity-animate');

// TODO Clean this file up. It's a total mess.

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

let $log = console.log,
    $warn = console.warn,
    $error = console.error;

console.log = function () {
  win.logger.info('ui: ' + Array.prototype.join.apply(arguments, [' ']));
  return $log.apply(console, arguments);
}
console.warn =  function () {
  win.logger.warn('ui: ' + Array.prototype.join.apply(arguments, [' ']));
  return $warn.apply(console, arguments);
}
console.error =  function () {
  win.logger.error('ui: ' + Array.prototype.join.apply(arguments, [' ']));
  return $error.apply(console, arguments);
}
window.onerror((e) => { console.error(e); });

function updateProfileLists() {
  $('#profile, #menuProfileList').empty();
  win.config.profileNames.forEach(name => {
    $('#profile, #menuProfileList').append(`<option value="${name}">${name}</option>`);
  });
  $('#profile').val(win.config.profile.name);
}

win.on('show', () => {
  // populate profiles list and register change events
  updateProfileLists();
  $('#profile').change(() => {
    win.config.profile = $('#profile').val();
    launcher.emit('profileChanged', win.config.profile);
  });
  launcher.emit('profileChanged', win.config.profile);
  $('#menuLauncher [data-setting="launcher:gameDir"]')
    .attr('placeholder', win.app.game.dir(null, true));
});

$(() => {

  // bind close/minimize buttons
  $('#windowClose').click(() => {
    win.close();
  });
  $('#windowMinimize').click(() => {
    win.minimize();
  });

  // setup modal functions
  let modal = $('#modal');
  function toggleModal() {
    const dur = 100;
    if (modal.is(':visible')) {
      modal.velocity({
        opacity: 0
      }, { display: 'none', duration: dur });
      modal.find('#modalForeground').velocity({
        width: '50%',
        height: '60%'
      }, { duration: dur, easing: 'ease-out' });
    } else {
      modal.velocity({
         opacity: 1
      }, { display: 'block', duration: dur });
      modal.find('#modalForeground').velocity({
        width: '70%',
        height: '80%'
      }, { duration: dur / 2, easing: 'spring' });
    }
  }
  let modalMenu = modal.find('#modalMenu');
  function setModalContent(contentID) {
    modalMenu.children().removeClass('active');
    modalMenu.find('[data-menu="' + contentID + '"]').addClass('active');
    modal.find('#modalForeground > .container > .content').children().hide();
    modal.find('#modalForeground > .container > .content > #' + contentID).show();
  }
  modal.find('#modalForeground #modalConfirm').click(() => {
    toggleModal();
  });
  modal.find('#modalBackground').click(() => {
    toggleModal();
  });
  modalMenu.find('li.menu-item').click(function () {
    setModalContent($(this).attr('data-menu'));
  });

  // helper function to get a more "friendly" version name
  function getFriendlyVersionName(vername) {
    if (vername.startsWith('b')) vername = 'Beta ' + vername.substring(1);
    else if (vername.startsWith('a')) vername = 'Alpha ' + vername.substring(1);
    else if (vername.startsWith('inf')) vername = 'InfDev';
    else if (vername.startsWith('c')) vername = 'Classic ' + vername.substring(1);
    else if (vername.startsWith('rd')) vername = 'Indev ' + vername.substring(3);
    return vername;
  }

  // launch button updater and bindings
  function updateLaunchButton(profile) {
    if (!profile) return;
    let button = $('#launch'),
      primary = button.find('.primary'),
      secondary = button.find('.secondary');

    if (profile.version) {
      let vername = getFriendlyVersionName(profile.version.id);
      primary.html('Launch Minecraft');
      secondary.html(profile.name + ' - ' + vername);
      button.attr('title', 'Ready to Launch Minecraft ' + vername);
      button.removeAttr('disabled');
    } else {
      primary.html('No Version Selected');
      secondary.html('Please Select a Version for this Profile');
      button.attr('disabled', true).removeAttr('title');
    }
  }
  launcher = new Launcher();
  launcher.on('profileChanged', profile => {
    updateLaunchButton(profile);
    updateProfileSettingsPage(profile);
  });

  // footer and frame button bindings
  $('#windowOptions').click(() => {
    toggleModal();
    setModalContent('menuLauncher');
  });
  $('#footer .fa.fa-cog').click(() => {
    toggleModal();
    setModalContent('menuProfile');
    updateProfileSettingsPage(win.config.profiles[$('#profile').val()]);
  });

  // menu launcher settings bindings
  $('#menuLauncher .menu-setting-switch input').change(function () {
    win.app.config.set($(this).attr('data-setting'), $(this).prop('checked'));
  }).each(function () {
    $(this).prop('checked', !!win.app.config.get($(this).attr('data-setting')));
  });
  $('#menuLauncher [data-setting="launcher:showConsole"]').change(() => {
    process.nextTick(win.app.updateConsoleVisibility());
  });

  // profile settings bindings
  function updateProfileSettingsPage(profile) {
    $('#menuProfileList').val(profile.name);
    let div = $('#menuProfileSelection');

    div.find('[data-setting="profile:name"]').val(profile.name);
    updateProfileVersions(profile);
    $('#menuProfileVersion').val(profile.$version || 'latest');
    $('[data-setting="profile:useCustom"]').prop('checked', profile.useCustom);
    $('[data-setting="profile:useExperimental"]').prop('checked', profile.useExperimental);
  }
  function updateProfileVersions(profile) {
    let select = $('#menuProfileVersion');
    if (select.children().length === 0) populateVersionSelection();
    select.prop('disabled', false).children().hide();
    if (profile.useCustom) {
      let children = select.children('[data-version-type="' + win.app.game.VersionType.CUSTOM + '"]');
      if (children.length === 0)
        select.prop('disabled', true).val('none').children('[value="none"]').show();
      else children.show();
    } else {
      select.children(':not([data-version-type="' + win.app.game.VersionType.CUSTOM + '"])').show();
      select.find('[value="none"]').hide();
      if (!profile.useExperimental)
        select.children('[data-version-type="' + win.app.game.VersionType.SNAPSHOT + '"]').hide();
    }
  }
  function getSelectedProfile() {
    return win.config.profiles[$('#menuProfileList').val()];
  }
  function populateVersionSelection() { // eslint-disable-line
    let select = $('#menuProfileVersion');
    select.prop('disabled', false).empty();
    select.append('<option value="latest">Use Latest Version</option>')
      .append('<option value="none">No Versions Selected</option>');
    for (let verID in win.config.versions.versions) {
      if (!win.config.versions.versions.hasOwnProperty(verID)) return;
      let ver = win.config.versions.versions[verID];
      select.append(`<option value="${ver.id}" data-version-type="${ver.type}">${ver.id}</option>`);
    }
  }
  $('#menuProfileList').change(function () {
    updateProfileSettingsPage(win.config.profiles[$(this).val()]);
  });
  $('#menuProfile [data-setting="profile:name"]').blur(function () {
    win.config.updateProfileName(getSelectedProfile().name, $(this).val());
    updateProfileLists();
    $('#menuProfileList').val($(this).val());
  });
  $('#menuProfile [data-setting="profile:useCustom"]').change(function () {
    getSelectedProfile().useCustom = $(this).prop('checked');
    $('#menuProfile [data-setting="profile:useExperimental"]')
      .prop('disabled', $(this).prop('checked'))
      .prop('checked', false);
    updateProfileVersions(getSelectedProfile());
  });
  $('[data-setting="profile:useExperimental"]').change(function () {
    getSelectedProfile().useExperimental = $(this).prop('checked');
    updateProfileVersions(getSelectedProfile());
  });
  $('[data-setting="profile:version"]').change(function () {
    getSelectedProfile().version = $(this).val();
  });

});
