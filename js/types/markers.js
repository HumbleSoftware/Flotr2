/** Markers **/
/**
 * Formats the marker labels.
 * @param {Object} obj - Marker value Object {x:..,y:..}
 * @return {String} Formatted marker string
 */
Flotr.defaultMarkerFormatter = function(obj){
  return (Math.round(obj.y*100)/100)+'';
};

Flotr.addType('markers', {
  options: {
    show: false,           // => setting to true will show markers, false will hide
    lineWidth: 1,          // => line width of the rectangle around the marker
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
        
      if(series.markers.stacked) {
        if(series.markers.stackingType == 'b'){
          // Stacked bars
          var stackOffsetPos = 0,
            stackOffsetNeg = 0;
            
          if(series.markers.horizontal) {
            stackOffsetPos = ya.values[y].stackMarkPos || 0;
            stackOffsetNeg = ya.values[y].stackMarkNeg || 0;
            if(x > 0) {
              ya.values[y].stackMarkPos = stackOffsetPos + x;
              x = stackOffsetPos + x;
            } else {
              ya.values[y].stackMarkNeg = stackOffsetNeg + x;
              x = stackOffsetNeg + x;
            }
          }
          else {
            stackOffsetPos = xa.values[x].stackMarkPos || 0;
            stackOffsetNeg = xa.values[x].stackMarkNeg || 0;
            if(y > 0) {
              xa.values[x].stackMarkPos = stackOffsetPos + y;
              y = stackOffsetPos + y;
            } else {
              xa.values[x].stackMarkNeg = stackOffsetNeg + y;
              y = stackOffsetNeg + y;
            }
          }
        } else if(series.markers.stackingType == 'a') {
          var stackOffset = xa.values[x].stackMark || 0;
            
          xa.values[x].stackMark = stackOffset + y;
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
    var ctx = this.ctx,
        dim = this.getTextDimensions(label, null, null),
        margin = 2,
        left = x,
        top = y;
        
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
    
    Flotr.drawText(ctx, label, left+margin, top+margin, {textBaseline: 'top', textAlign: 'left', size: options.fontSize});
  }
});
