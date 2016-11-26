'use strict';

window.EventEmitter = class EventEmitter {
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
