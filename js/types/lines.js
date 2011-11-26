/** Lines **/
Flotr.addType('lines', {
  options: {
    show: false,           // => setting to true will show lines, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: false,           // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    stacked: false         // => setting to true will show stacked lines, false will show normal lines
  },
  /**
   * Draws lines series in the canvas element.
   * @param {Object} series - Series with options.lines.show = true.
   */
  draw: function(series){

    var ctx = this.ctx,
      lineWidth = series.lines.lineWidth,
      shadowSize = series.shadowSize,
      offset;

    series = series || this.series;

    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'round';

    if(shadowSize){

      ctx.lineWidth = shadowSize / 2;
      offset = lineWidth/2 + ctx.lineWidth/2;
      
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      this.lines.plot(series, offset + shadowSize/2, false);

      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      this.lines.plot(series, offset, false);
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = series.color;

    this.lines.plot(series, 0, true);

    ctx.restore();
  },

  getStack: function (series) {
    var stack = false;
    if(series.lines.stacked) {
      stack = series.xaxis.getStack('lines');
      if (Flotr._.isEmpty(stack)) {
        stack.values = [];
      }
    }

    return stack;
  },

  plot: function(series, shadowOffset, incStack){

    var ctx = this.ctx,
      xa = series.xaxis,
      ya = series.yaxis,
      data = series.data, 
      length = data.length - 1,
      width = this.plotWidth, 
      height = this.plotHeight,
      prevx = null,
      prevy = null,
      stack = this.lines.getStack(series),
      zero = ya.d2p(0),
      x1, x2, y1, y2, stack1, stack2, i;
      
    if(length < 1) return;

    ctx.beginPath();

    for(i = 0; i < length; ++i){

      // To allow empty values
      if (data[i][1] === null || data[i+1][1] === null) continue;

      // Zero is infinity for log scales
      if (xa.options.scaling === 'logarithmic' && (data[i][0] <= 0 || data[i+1][0] <= 0)) continue;
      if (ya.options.scaling === 'logarithmic' && (data[i][1] <= 0 || data[i+1][1] <= 0)) continue;
      
      x1 = xa.d2p(data[i][0]);
      x2 = xa.d2p(data[i+1][0]);
      
      if (stack) {

        stack1 = stack.values[data[i][0]] || 0;
        stack2 = stack.values[data[i+1][0]] || stack.values[data[i][0]] || 0;

        y1 = ya.d2p(data[i][1] + stack1);
        y2 = ya.d2p(data[i+1][1] + stack2);
        
        if(incStack){
          stack.values[data[i][0]] = data[i][1]+stack1;
            
          if(i == length-1)
            stack.values[data[i+1][0]] = data[i+1][1]+stack2;
        }
      }
      else{
        y1 = ya.d2p(data[i][1]);
        y2 = ya.d2p(data[i+1][1]);
      }

      if ((y1 >= height && y2 >= width) || 
        (y1 <= 0 && y2 <= 0) ||
        (x1 <= 0 && x2 <= 0) ||
        (x1 >= width && x2 >= width)) continue;

      if((prevx != x1) || (prevy != y1 + shadowOffset))
        ctx.moveTo(x1, y1 + shadowOffset);
      
      prevx = x2;
      prevy = y2 + shadowOffset;
      ctx.lineTo(prevx, prevy);
    }
    
    ctx.stroke();

    // TODO stacked lines
    if(!shadowOffset && series.lines.fill){
      ctx.fillStyle = this.processColor(series.lines.fillColor || series.color, {opacity: series.lines.fillOpacity});
      ctx.lineTo(x2, zero);
      ctx.lineTo(xa.d2p(data[0][0]), zero);
      ctx.lineTo(xa.d2p(data[0][0]), ya.d2p(data[0][1]));
      ctx.fill();
    }

    ctx.closePath();
  },

  extendYRange : function (axis, data, options, lines) {

    var
      o = axis.options;

    if (options.stacked
      && ((!o.max && o.max !== 0) || (!o.min && o.min !== 0))) {

      var
        newmax = axis.max,
        newmin = axis.min,
        positiveSums = lines.positiveSums || {},
        negativeSums = lines.negativeSums || {},
        x, j;

      for (j = 0; j < data.length; j++) {

        x = data[j][0] + '';

        // Positive
        if (data[j][1] > 0) {
          positiveSums[x] = (positiveSums[x] || 0) + data[j][1];
          newmax = Math.max(newmax, positiveSums[x]);
        }

        // Negative
        else {
          negativeSums[x] = (negativeSums[x] || 0) + data[j][1];
          newmin = Math.min(newmin, negativeSums[x]);
        }
      }

      lines.negativeSums = negativeSums;
      lines.positiveSums = positiveSums;

      axis.max = newmax;
      axis.min = newmin;
    }
  },

});
