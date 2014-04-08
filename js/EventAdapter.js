/**
 * Flotr Event Adapter
 */
(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../lib/bean"), require("../lib/underscore"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../lib/bean", "underscore"], mod);
  else // Plain browser env
    Flotr.EventAdapter = mod(bean, _);
})(function(bean, _) {
"use strict";

return {
  observe: function(object, name, callback) {
    bean.add(object, name, callback);
    return this;
  },
  fire: function(object, name, args) {
    bean.fire(object, name, args);
    if (typeof(Prototype) != 'undefined')
      Event.fire(object, name, args);
    // @TODO Someone who uses mootools, add mootools adapter for existing applciations.
    return this;
  },
  stopObserving: function(object, name, callback) {
    bean.remove(object, name, callback);
    return this;
  },
  eventPointer: function(e) {
    if (!_.isUndefined(e.touches) && e.touches.length > 0) {
      return {
        x : e.touches[0].pageX,
        y : e.touches[0].pageY
      };
    } else if (!_.isUndefined(e.changedTouches) && e.changedTouches.length > 0) {
      return {
        x : e.changedTouches[0].pageX,
        y : e.changedTouches[0].pageY
      };
    } else if (e.pageX || e.pageY) {
      return {
        x : e.pageX,
        y : e.pageY
      };
    } else if (e.clientX || e.clientY) {
      var
        d = document,
        b = d.body,
        de = d.documentElement;
      return {
        x: e.clientX + b.scrollLeft + de.scrollLeft,
        y: e.clientY + b.scrollTop + de.scrollTop
      };
    }
  }
};
});
