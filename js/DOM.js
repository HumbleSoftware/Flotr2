(function () {

var _ = Flotr._;

function getEl (el) {
  return (el && el.jquery) ? el[0] : el;
}

Flotr.DOM = {
  addClass: function(element, name){
    element = getEl(element);
    var classList = (element.className ? element.className : '');
      if (_.include(classList.split(/\s+/g), name)) return;
    element.className = (classList ? classList + ' ' : '') + name;
  },
  /**
   * Create an element.
   */
  create: function(tag){
    return document.createElement(tag);
  },
  node: function(html) {
    var div = Flotr.DOM.create('div'), n;
    div.innerHTML = html;
    n = div.children[0];
    div.innerHTML = '';
    return n;
  },
  /**
   * Remove all children.
   */
  empty: function(element){
    element = getEl(element);
    element.innerHTML = '';
    /*
    if (!element) return;
    _.each(element.childNodes, function (e) {
      Flotr.DOM.empty(e);
      element.removeChild(e);
    });
    */
  },
  remove: function (element) {
    element = getEl(element);
    element.parentNode.removeChild(element);
  },
  hide: function(element){
    element = getEl(element);
    Flotr.DOM.setStyles(element, {display:'none'});
  },
  /**
   * Insert a child.
   * @param {Element} element
   * @param {Element|String} Element or string to be appended.
   */
  insert: function(element, child){
    element = getEl(element);
    if(_.isString(child))
      element.innerHTML += child;
    else if (_.isElement(child))
      element.appendChild(child);
  },
  // @TODO find xbrowser implementation
  opacity: function(element, opacity) {
    element = getEl(element);
    element.style.opacity = opacity;
  },
  position: function(element, p){
    element = getEl(element);
    if (!element.offsetParent)
      return {left: (element.offsetLeft || 0), top: (element.offsetTop || 0)};

    p = this.position(element.offsetParent);
    p.left  += element.offsetLeft;
    p.top   += element.offsetTop;
    return p;
  },
  removeClass: function(element, name) {
    var classList = (element.className ? element.className : '');
    element = getEl(element);
    element.className = _.filter(classList.split(/\s+/g), function (c) {
      if (c != name) return true; }
    ).join(' ');
  },
  setStyles: function(element, o) {
    element = getEl(element);
    _.each(o, function (value, key) {
      element.style[key] = value;
    });
  },
  show: function(element){
    element = getEl(element);
    Flotr.DOM.setStyles(element, {display:''});
  },
  /**
   * Return element size.
   */
  size: function(element){
    element = getEl(element);
    return {
      height : element.offsetHeight,
      width : element.offsetWidth };
  }
};

})();
