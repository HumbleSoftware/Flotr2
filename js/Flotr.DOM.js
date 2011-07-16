Flotr.DOM = {
  addClass: function(element, s){
  },
  /**
   * Create an element.
   */
  create: function(tag){
    return document.createElement(tag);
  },
  /**
   * Remove all children.
   */
  empty: function(element){
    _.each(element.childNodes, function (e) { element.removeChild(e); });
  },
  insert: function(element, child){
  },
  set: function(element, content){
  },
  setStyles: function(element, o) {
    _.each(o, function (value, key) {
      element.style[key] = value;
    });
  },
  /**
   * Return element size.
   */
  size: function(element){
    return {
      height : element.scrollHeight,
      width: element.scrollWidth }
  }
};
