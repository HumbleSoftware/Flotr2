/**
 * Flotr Event Adapter
 */
Flotr.EventAdapter = {
  observe: function(object, name, callback) {
    Event.observe(object, name, callback);
  },
  fire: function(object, name, args) {
    Event.fire(object, name, args);
  }
};
