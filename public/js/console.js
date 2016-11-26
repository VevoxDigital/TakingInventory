'use strict';

const {remote} = require('electron');
window.$ = window.jQuery = require('jquery');

let tabs = { };

function updateConsoleTab(tab) {
  let tabs = $('#tabs');
  tabs.children().removeClass('active');
  tabs.find('[data-tab=' + tab + ']').addClass('active');

  let windows = $('#console');
  windows.children().hide();
  windows.find('div[data-tab=\'' + tab + '\']').show();
}

remote.getCurrentWindow().on('launcher-output', (output) => {
  if (!tabs[output.tab.id]) {
    let tab = { };
    tab.window = $('<div/>').append(
      `<div class="console-window" data-tab="${output.tab.id}" style="display:none">
        <table><tbody></tbody></table>
      </div>`).contents();
    tab.tab = $('<div/>').append(
      `<button href="javascript:" class="console-tab" data-tab="${output.tab.id}">
        ${output.tab.name}
      </button>`).contents();
    tabs[output.tab.id] = tab;
    $('#tabs').append(tab.tab);
    $('#console').append(tab.window);
    tab.tab.click(() => {
      updateConsoleTab(output.tab.id);
    });
  }

  let tab = tabs[output.tab.id], tr = $('<tr/>');

  tr.addClass('level-' + output.level)
    .append(`<td class="col-time">${output.time.format('HH:mm:ss')}</td>`)
    .append(`<td class="col-level">${output.level}</td>`)
    .append(`<td class="col-msg">${output.msg}</td>`).appendTo(tab.window.find('tbody'));
});

$(() => {
  setTimeout(() => { updateConsoleTab('launcher'); }, 500);

});
