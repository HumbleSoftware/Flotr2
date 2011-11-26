/**
 * Text Utilities
 */
(function () {

var
  F = Flotr,
  D = F.DOM,
  _ = F._,

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
  },

  measureText : function (ctx, text, style) {

    var
      context = this.o.ctx,
      metrics;

    if (!context.fillText || F.isIphone) {
      return { width : context.measure(text, style)};
    }

    style = _.extend({
      size: Flotr.defaultOptions.fontSize,
      weight: 1,
      angle: 0
    }, style);

    context.save();
    context.font = (style.weight > 1 ? "bold " : "") + (style.size*1.3) + "px sans-serif";
    metrics = context.measureText(text);
    context.restore();

    return metrics;
  }
};

Flotr.Text = Text;

})();
