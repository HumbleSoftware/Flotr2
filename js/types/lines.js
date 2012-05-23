/** Lines **/
Flotr.addType('lines', {
  options: {
    show: false,           // => setting to true will show lines, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: false,           // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillBorder: false,     // => draw a border around the fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    steps: false,          // => draw steps
    stacked: false         // => setting to true will show stacked lines, false will show normal lines
  },

  stack : {
    values : []
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

  plot : function (options, shadowOffset, incStack) {

    var
      context   = options.context,
      width     = options.width, 
      height    = options.height,
      xScale    = options.xScale,
      yScale    = options.yScale,
      data      = options.data, 
      stack     = options.stacked ? this.stack : false,
      length    = data.length - 1,
      prevx     = null,
      prevy     = null,
      zero      = yScale(0),
      start     = null,
      end       = null,
      x1, x2, y1, y2, stack1, stack2, i;

    if (length < 1) return;

    context.beginPath();

    for (i = 0; i < length; ++i) {

      // To allow empty values
      if (data[i][1] === null || data[i+1][1] === null) {
        if (i > 0 && data[i][1]) {
          context.stroke();
          // increment the stack when data[i] is not empty, otherwise
          // we miss this step
          increment_stack();

          // Reopening the path is mandatory even if we don't fill
          if (options.fill)
            fill();
          start = null;
          context.closePath();
          context.beginPath();
        }
        continue;
      }

      // Zero is infinity for log scales
      // TODO handle zero for logarithmic
      // if (xa.options.scaling === 'logarithmic' && (data[i][0] <= 0 || data[i+1][0] <= 0)) continue;
      // if (ya.options.scaling === 'logarithmic' && (data[i][1] <= 0 || data[i+1][1] <= 0)) continue;

      x1 = xScale(data[i][0]);
      x2 = xScale(data[i+1][0]);

      // When we have staked graphs, compute the new Y offset (series
      // are plotted one after another) and store it in the stack if asked
      if (stack) {
        stack1 = stack.values[data[i][0]] || 0;
        stack2 = stack.values[data[i+1][0]] || 0;

        y1 = yScale(data[i][1] + stack1);
        y2 = yScale(data[i+1][1] + stack2);

        increment_stack();
      }
      else{
        y1 = yScale(data[i][1]);
        y2 = yScale(data[i+1][1]);
      }

      // When we restart the line, first move to the start position (x1, y1)
      if (start === null) {
        context.moveTo(x1, y1 + shadowOffset);
        start = i;
      }

      prevx = x2;
      prevy = y2 + shadowOffset;
      if (options.steps) {
        context.lineTo(prevx + shadowOffset / 2, y1 + shadowOffset);
        context.lineTo(prevx + shadowOffset / 2, prevy);
      } else {
        context.lineTo(prevx, prevy);
      }

      // Save the index of the last point of the line for the fill function
      end = i+1;
    }
    
    if (!options.fill || options.fill && !options.fillBorder) context.stroke();

    fill();

    // quick and dirty fonction to save data to the stack
    function increment_stack() {
      if(stack && incStack){
        stack.values[data[i][0]] = data[i][1] + (stack.values[data[i][0]] || 0);
        
        if(i == length-1)
          stack.values[data[i+1][0]] = data[i+1][1] + (stack.values[data[i+1][0]] || 0);
      }
    }


    function fill () {
      var j;

      if(!shadowOffset && options.fill && start !== null){
        context.fillStyle = options.fillStyle;

        // To handle the stacked lines, we will close the line into a
        // filled shape that follows the previous line.

        // The current position is at the end of the line, so we continue to
        // plot from "right to left" following the previous series
        // line (the stack value of X has been updated in meantime)
        for (j = end || start; j >= start; j--) {

          x1 = xScale(data[j][0]);
          if (stack)
            y1 = yScale((stack.values[data[j][0]] - data[j][1]) || 0);
          else
            y1 = zero;

          if (options.steps) {
            context.lineTo(prevx, prevy);
            context.lineTo(prevx, y1);
            if (!j)
              context.lineTo(x1, y1);
          } else {
            context.lineTo(x1, y1);
          }

          // Remember to previous point for steps
          prevx = x1;
          prevy = y1;
        }

        // Close the line
        if (stack)
          context.lineTo(xScale(data[start][0]), yScale(stack.values[data[start][0]]));
        else
          context.lineTo(xScale(data[start][0]), yScale(data[start][1]));

        context.fill();
        if (options.fillBorder) {
          context.stroke();
        }
      }
    }

    context.closePath();
    
  },

  // Perform any pre-render precalculations (this should be run on data first)
  // - Pie chart total for calculating measures
  // - Stacks for lines and bars
  // precalculate : function () {
  // }
  //
  //
  // Get any bounds after pre calculation (axis can fetch this if does not have explicit min/max)
  // getBounds : function () {
  // }
  // getMin : function () {
  // }
  // getMax : function () {
  // }
  //
  //
  // Padding around rendered elements
  // getPadding : function () {
  // }

  extendYRange : function (axis, data, options, lines) {

    var o = axis.options;

    // If stacked and auto-min
    if (options.stacked && ((!o.max && o.max !== 0) || (!o.min && o.min !== 0))) {

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

    if (options.steps) {

      this.hit = function (options) {
        var
          data = options.data,
          args = options.args,
          yScale = options.yScale,
          mouse = args[0],
          length = data.length,
          n = args[1],
          x = mouse.x,
          relY = mouse.relY,
          i;

        for (i = 0; i < length - 1; i++) {
          if (x >= data[i][0] && x <= data[i+1][0]) {
            if (Math.abs(yScale(data[i][1]) - relY) < 8) {
              n.x = data[i][0];
              n.y = data[i][1];
              n.index = i;
              n.seriesIndex = options.index;
            }
            break;
          }
        }
      };

      this.drawHit = function (options) {
        var
          context = options.context,
          args    = options.args,
          data    = options.data,
          xScale  = options.xScale,
          index   = args.index,
          x       = xScale(args.x),
          y       = options.yScale(args.y),
          x2;

        if (data.length - 1 > index) {
          x2 = options.xScale(data[index + 1][0]);
          context.save();
          context.strokeStyle = options.color;
          context.lineWidth = options.lineWidth;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x2, y);
          context.stroke();
          context.closePath();
          context.restore();
        }
      };

      this.clearHit = function (options) {
        var
          context = options.context,
          args    = options.args,
          data    = options.data,
          xScale  = options.xScale,
          width   = options.lineWidth,
          index   = args.index,
          x       = xScale(args.x),
          y       = options.yScale(args.y),
          x2;

        if (data.length - 1 > index) {
          x2 = options.xScale(data[index + 1][0]);
          context.clearRect(x - width, y - width, x2 - x + 2 * width, 2 * width);
        }
      };
    }
  }

});
