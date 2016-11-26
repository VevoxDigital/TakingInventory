'use strict';

const {remote} = require('electron');
window.$ = window.jQuery = require('jquery');

$(() => {

  $('#windowClose').click(() => {
    remote.getCurrentWindow().close();
  });
  $('#windowMinimize').click(() => {
    remote.getCurrentWindow().minimize();
  });

  setTimeout(() => {
    $('#launch').removeAttr('disabled');
  }, 1000);

});
