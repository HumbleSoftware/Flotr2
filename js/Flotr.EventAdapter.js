/**
 * Flotr Event Adapter
 */
Flotr.EventAdapter = {
  observe: function(object, name, callback) {
    Event.observe(object, name, callback);
    return this;
  },
  fire: function(object, name, args) {
    Event.fire(object, name, args);
    return this;
  },
  stopObserving: function(object, name, callback) {
    Event.stopObserving(object, name, callback);
    return this;
  }
};
