/**
 * Text Utilities
 */
(function () {

var
  D = Flotr.DOM,

Text = function (o) {
  this.o = o;
};

Text.prototype = {

  dimensions : function (text, canvasStyle, htmlStyle, className) {

    if (!text) return { width : 0, height : 0 };
    
    return (this.o.html) ?
      this.html(text, this.o.element, htmlStyle, className) : 
      this.canvas(text, canvasStyle);
  },

  canvas : function (text, style) {

    console.log(this.o.ctx);

    if (!this.o.textEnabled) return;

    var bounds = this.o.ctx.getTextBounds(text, style);

    return {
      width  : bounds.width + 2, // @TODO what are these paddings?
      height : bounds.height + 6
    };
  },

  html : function (text, element, style, className) {

    var div = D.create('div');

    D.setStyles(div, { 'position' : 'absolute', 'top' : '-10000px' });
    D.insert(div, '<div style="'+style+'" class="'+className+' flotr-dummy-div">' + text + '</div>');
    D.insert(this.o.element, div);

    return D.size(div);
  }
};

Flotr.Text = Text;

})();
