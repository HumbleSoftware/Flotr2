/** Markers **/
/**
 * Formats the marker labels.
 * @param {Object} obj - Marker value Object {x:..,y:..}
 * @return {String} Formatted marker string
 */
(function () {

Flotr.defaultMarkerFormatter = function(obj){
  return (Math.round(obj.y*100)/100)+'';
};

Flotr.addType('markers', {
  options: {
    show: false,           // => setting to true will show markers, false will hide
    lineWidth: 1,          // => line width of the rectangle around the marker
    color: '#000000',      // => text color
    fill: false,           // => fill or not the marekers' rectangles
    fillColor: "#FFFFFF",  // => fill color
    fillOpacity: 0.4,      // => fill opacity
    stroke: false,         // => draw the rectangle around the markers
    position: 'ct',        // => the markers position (vertical align: b, m, t, horizontal align: l, c, r)
    labelFormatter: Flotr.defaultMarkerFormatter,
    fontSize: Flotr.defaultOptions.fontSize,
    stacked: false,        // => true if markers should be stacked
    stackingType: 'b',     // => define staching behavior, (b- bars like, a - area like) (see Issue 125 for details)
    horizontal: false      // => true if markers should be horizontal (For now only in a case on horizontal stacked bars, stacks should be calculated horizontaly)
  },
  getStack: function (series) {
    var stack = false;
    if(series.bars.stacked) {
      stack = (series.bars.horizontal ? series.yaxis : series.xaxis).getStack('bars');
      if (Flotr._.isEmpty(stack)) {
        stack.positive = [];
        stack.negative = [];
        stack.values = [];
      }
    }

    return stack;
  },
  /**
   * Draws lines series in the canvas element.
   * @param {Object} series - Series with options.lines.show = true.
   */
  draw: function(series){
    series = series || this.series;
    var ctx = this.ctx,
        xa = series.xaxis,
        ya = series.yaxis,
        options = series.markers,
        stack = this.markers.getStack(series),
        data = series.data;
        
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'round';
    ctx.lineWidth = options.lineWidth;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = this.processColor(options.fillColor, {opacity: options.fillOpacity});

    for(var i = 0; i < data.length; ++i){
    
      var x = data[i][0],
        y = data[i][1],
        label;
        
      if(stack) {
        if(series.markers.stackingType == 'b'){

          var stackOffsetPos = 0,
            stackOffsetNeg = 0;
            
          if(series.markers.horizontal) {
            stackOffsetPos = stack.positive[y] || 0;
            stackOffsetNeg = stack.negative[y] || 0;
            if(x > 0) {
              stack.positive[y] = stackOffsetPos + x;
              x = stackOffsetPos + x;
            } else {
              stack.negative[y] = stackOffsetNeg + x;
              x = stackOffsetNeg + x;
            }
          }
          else {
            stackOffsetPos = stack.negative[x] || 0;
            stackOffsetNeg = stack.positive[x] || 0;
            if(y > 0) {
              stack.positive[x] = stackOffsetPos + y;
              y = stackOffsetPos + y;
            } else {
              stack.negative[x] = stackOffsetNeg + y;
              y = stackOffsetNeg + y;
            }
          }
        } else if(series.markers.stackingType == 'a') {
          var stackOffset = stack.values[x] || 0;
          stack.values[x] = stackOffset + y;
          y = stackOffset + y;
        }
      }
      var xPos = xa.d2p(x),
        yPos = ya.d2p(y);
        label = options.labelFormatter({x: x, y: y, index: i, data : data});

      this.markers.plot(xPos, yPos, label, options);
    }
    ctx.restore();
  },
  plot: function(x, y, label, options) {
    if ( isImage(label) && !label.complete) {
      Flotr.EventAdapter.observe(label, 'load', Flotr._.bind(function () {
        var ctx = this.ctx;
        ctx.save();
        ctx.translate(this.plotOffset.left, this.plotOffset.top);
        this.markers._plot(x, y, label, options);
        ctx.restore();
      }, this));
    } else {
      this.markers._plot(x, y, label, options);
    }
  },

  _plot: function(x, y, label, options) {
    var ctx = this.ctx,
        margin = 2,
        left = x,
        top = y,
        dim;

    if (isImage(label))
      dim = {height : label.height, width: label.width};
    else
      dim = this._text.canvas(label);

    dim.width = Math.floor(dim.width+margin*2);
    dim.height = Math.floor(dim.height+margin*2);

         if (options.position.indexOf('c') != -1) left -= dim.width/2 + margin;
    else if (options.position.indexOf('l') != -1) left -= dim.width;
    
         if (options.position.indexOf('m') != -1) top -= dim.height/2 + margin;
    else if (options.position.indexOf('t') != -1) top -= dim.height;
    
    left = Math.floor(left)+0.5;
    top = Math.floor(top)+0.5;
    
    if(options.fill)
      ctx.fillRect(left, top, dim.width, dim.height);
      
    if(options.stroke)
      ctx.strokeRect(left, top, dim.width, dim.height);
    
    if (isImage(label))
      ctx.drawImage(label, left+margin, top+margin);
    else
      Flotr.drawText(ctx, label, left+margin, top+margin, {textBaseline: 'top', textAlign: 'left', size: options.fontSize, color: options.color});
  }
});

function isImage (i) {
  return typeof i === 'object' && i.constructor && i.constructor === Image;
}

})();
