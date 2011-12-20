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
   * @param {Object} options
   */
  draw : function (options) {

    var
      context     = options.context,
      lineWidth   = options.lineWidth,
      shadowSize  = options.shadowSize,
      offset;

    context.save();
    context.translate(options.offsetLeft, options.offsetTop);
    context.lineJoin = 'round';

    if (shadowSize) {

      context.lineWidth = shadowSize / 2;
      offset = lineWidth / 2 + context.lineWidth / 2;
      
      // @TODO do this instead with a linear gradient
      context.strokeStyle = "rgba(0,0,0,0.1)";
      this.plot(options, offset + shadowSize / 2, false);

      context.strokeStyle = "rgba(0,0,0,0.2)";
      this.plot(options, offset, false);
    }

    context.lineWidth = lineWidth;
    context.strokeStyle = options.color;

    this.plot(options, 0, true);

    context.restore();
  },

  getEmptyStack : function () {
    return { values : [] };
  },

  plot: function (options, shadowOffset, incStack){

    var
      context   = options.context,
      width     = options.plotWidth, 
      height    = options.plotHeight,
      xScale    = options.xScale,
      yScale    = options.yScale,
      data      = options.data, 
      stack     = options.stack,
      length    = data.length - 1,
      prevx     = null,
      prevy     = null,
      zero      = yScale(0),
      x1, x2, y1, y2, stack1, stack2, i;
      
    if (length < 1) return;

    context.beginPath();

    for (i = 0; i < length; ++i) {

      // To allow empty values
      if (data[i][1] === null || data[i+1][1] === null) continue;

      // Zero is infinity for log scales
      // TODO handle zero for logarithmic
      // if (xa.options.scaling === 'logarithmic' && (data[i][0] <= 0 || data[i+1][0] <= 0)) continue;
      // if (ya.options.scaling === 'logarithmic' && (data[i][1] <= 0 || data[i+1][1] <= 0)) continue;
      
      x1 = xScale(data[i][0]);
      x2 = xScale(data[i+1][0]);
      
      if (stack) {

        stack1 = stack.values[data[i][0]] || 0;
        stack2 = stack.values[data[i+1][0]] || stack.values[data[i][0]] || 0;

        y1 = yScale(data[i][1] + stack1);
        y2 = yScale(data[i+1][1] + stack2);
        
        if(incStack){
          stack.values[data[i][0]] = data[i][1]+stack1;
            
          if(i == length-1)
            stack.values[data[i+1][0]] = data[i+1][1]+stack2;
        }
      }
      else{
        y1 = yScale(data[i][1]);
        y2 = yScale(data[i+1][1]);
      }

      if ((y1 >= height && y2 >= width) || 
        (y1 <= 0 && y2 <= 0) ||
        (x1 <= 0 && x2 <= 0) ||
        (x1 >= width && x2 >= width)) continue;

      if((prevx != x1) || (prevy != y1 + shadowOffset))
        context.moveTo(x1, y1 + shadowOffset);
      
      prevx = x2;
      prevy = y2 + shadowOffset;
      context.lineTo(prevx, prevy);
    }
    
    context.stroke();

    // TODO stacked lines
    if(!shadowOffset && options.fill){
      context.fillStyle = options.fillStyle;
      context.lineTo(x2, zero);
      context.lineTo(xScale(data[0][0]), zero);
      context.lineTo(xScale(data[0][0]), yScale(data[0][1]));
      context.fill();
    }

    context.closePath();
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
