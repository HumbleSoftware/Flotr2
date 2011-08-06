/**
 * Flotr Event Adapter
 */
Flotr.EventAdapter = {
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
    if (Flotr.isIE && Flotr.isIE < 9) {
      return {x: e.clientX + document.body.scrollLeft, y: e.clientY + document.body.scrollTop};
    } else {
      return {x: e.pageX, y: e.pageY};
    }
  }
};
