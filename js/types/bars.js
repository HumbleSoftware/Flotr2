/** Bars **/
Flotr.addType('bars', {

  options: {
    show: false,           // => setting to true will show bars, false will hide
    lineWidth: 2,          // => in pixels
    barWidth: 1,           // => in units of the x axis
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    horizontal: false,     // => horizontal bars (x and y inverted)
    stacked: false,        // => stacked bar charts
    centered: true         // => center the bars to their x axis value
  },

  draw : function (options) {
    var
      context = options.context;

    context.save();
    context.translate(options.offsetLeft, options.offsetTop);
    context.lineJoin = 'miter';
    // @TODO linewidth not interpreted the right way.
    context.lineWidth = Math.min(options.lineWidth, options.barWidth);
    context.strokeStyle = options.color;
    if (options.fill) context.fillStyle = options.fillStyle
    
    this.plot(options);

    context.restore();
  },

  getEmptyStack : function () {
    return { 
      positive : [],
      negative : [],
      _positive : [], // Shadow
      _negative : []  // Shadow
    };
  },

  plot : function (options) {

    var
      data            = options.data,
      context         = options.context,
      barWidth        = options.barWidth,
      shadowSize      = options.shadowSize,
      horizontal      = options.horizontal,
      centered        = options.centered,
      stack           = options.stack,
      xIndex          = horizontal ? 1 : 0,
      yIndex          = horizontal ? 0 : 1,
      xScale          = horizontal ? options.yScale : options.xScale,
      yScale          = horizontal ? options.xScale : options.yScale,
      stackOffsetPos  = 0,
      stackOffsetNeg  = 0,
      barOffset,
      stackIndex,
      stackValue,
      stackOffsetPos,
      stackOffsetNeg,
      width, height,
      xaLeft, xaRight, yaTop, yaBottom,
      left, right, top, bottom,
      i, x, y;

    if (data.length < 1) return;

    if (horizontal) {
      context.rotate(-Math.PI / 2)
      context.scale(-1, 1);
    }

    for (i = 0; i < data.length; i++) {

      x = data[i][xIndex];
      y = data[i][yIndex];

      if (y === null) continue;

      // Stacked bars
      if (stack) {
        stackOffsetPos = stack.positive[x] || stackOffsetPos;
        stackOffsetNeg = stack.negative[x] || stackOffsetNeg;

        if (y > 0) {
          stack.positive[x] = stackOffsetPos + y;
        } else {
          stack.negative[x] = stackOffsetNeg + y;
        }
      }
      
      if (y > 0) {
        bottom = stackOffsetPos;
        top = y + stackOffsetPos;
      } else {
        top = stackOffsetNeg;
        bottom = y + stackOffsetNeg;
      }
        
      barOffset = centered ? barWidth/2 : 0;
      left = x - barOffset;
      right = x + barWidth - barOffset;

      /*
       * TODO Skipping...
      if (right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;

      if (left    < xa.min) left    = xa.min;
      if (right   > xa.max) right   = xa.max;
      if (bottom  < ya.min) bottom  = ya.min;
      if (top     > ya.max) top     = ya.max;
      */
      
      // Cache d2p values
      xaLeft   = xScale(left);
      xaRight  = xScale(right);
      yaTop    = yScale(top);
      yaBottom = yScale(bottom);
      width    = xaRight - xaLeft;
      height   = yaBottom - yaTop;

      if (options.fill) context.fillRect(xaLeft, yaTop, width, height);

      if (shadowSize) {
        context.save();
        context.fillStyle = 'rgba(0,0,0,0.05)';
        context.fillRect(xaLeft + shadowSize, yaTop + shadowSize, width, height);
        context.restore();
      }

      if (options.lineWidth != 0) {
        context.strokeRect(xaLeft, yaTop, width, height);
      }
    }
  },

  extendXRange : function (axis, data, options, bars) {
    this.bars._extendRange(axis, data, options, bars);
  },

  extendYRange : function (axis, data, options, bars) {
    this.bars._extendRange(axis, data, options, bars);
  },
  _extendRange: function (axis, data, options, bars) {

    var
      max = axis.options.max;

    if (_.isNumber(max) || _.isString(max)) return; 

    var
      newmin = axis.min,
      newmax = axis.max,
      orientation = axis.orientation,
      positiveSums = bars.positiveSums || {},
      negativeSums = bars.negativeSums || {},
      value, datum, index, j;

    // Sides of bars
    if ((orientation == 1 && !options.horizontal) || (orientation == -1 && options.horizontal)) {
      if (options.centered) {
        newmax = Math.max(axis.datamax + 0.5, newmax);
        newmin = Math.min(axis.datamin - 0.5, newmin);
      }
    }

    // End of bars
    if ((orientation == 1 && options.horizontal) || (orientation == -1 && !options.horizontal)) {
      if (options.barWidth + axis.datamax >= newmax)
        newmax = axis.max + (options.centered ? options.barWidth/2 : options.barWidth);
    }

    if (options.stacked && 
        ((orientation == 1 && options.horizontal) || (orientation == -1 && !options.horizontal))){

      for (j = data.length; j--;) {
        value = data[j][(orientation == 1 ? 1 : 0)]+'';
        datum = data[j][(orientation == 1 ? 0 : 1)];

        // Positive
        if (datum > 0) {
          positiveSums[value] = (positiveSums[value] || 0) + datum;
          newmax = Math.max(newmax, positiveSums[value]);
        }

        // Negative
        else {
          negativeSums[value] = (negativeSums[value] || 0) + datum;
          newmin = Math.min(newmin, negativeSums[value]);
        }
      }
    }

    bars.negativeSums = negativeSums;
    bars.positiveSums = positiveSums;

    axis.max = newmax;
    axis.min = newmin;
  },

  drawHit: function (n) {
    var octx = this.octx,
      s = n.series,
      xa = n.xaxis,
      ya = n.yaxis,
      lx, rx, ly, uy;

    octx.save();
    octx.translate(this.plotOffset.left, this.plotOffset.top);
    octx.beginPath();
    
    if (s.mouse.trackAll) {
      octx.moveTo(xa.d2p(n.x), ya.d2p(0));
      octx.lineTo(xa.d2p(n.x), ya.d2p(n.yaxis.max));
    }
    else {
      var bw = s.bars.barWidth,
        y = ya.d2p(n.y), 
        x = xa.d2p(n.x);
        
      if(!s.bars.horizontal){ //vertical bars (default)
        ly = ya.d2p(ya.min<0? 0 : ya.min); //lower vertex y value (in points)
        
        if(s.bars.centered){
          lx = xa.d2p(n.x-(bw/2));
          rx = xa.d2p(n.x+(bw/2));
        
          octx.moveTo(lx, ly);
          octx.lineTo(lx, y);
          octx.lineTo(rx, y);
          octx.lineTo(rx, ly);
        } else {
          rx = xa.d2p(n.x+bw); //right vertex x value (in points)
          
          octx.moveTo(x, ly);
          octx.lineTo(x, y);
          octx.lineTo(rx, y);
          octx.lineTo(rx, ly);
        }
      } else { //horizontal bars
        lx = xa.d2p(xa.min<0? 0 : xa.min); //left vertex y value (in points)
          
        if(s.bars.centered){
          ly = ya.d2p(n.y-(bw/2));
          uy = ya.d2p(n.y+(bw/2));
                       
          octx.moveTo(lx, ly);
          octx.lineTo(x, ly);
          octx.lineTo(x, uy);
          octx.lineTo(lx, uy);
        } else {
          uy = ya.d2p(n.y+bw); //upper vertex y value (in points)
        
          octx.moveTo(lx, y);
          octx.lineTo(x, y);
          octx.lineTo(x, uy);
          octx.lineTo(lx, uy);
        }
      }

      if(s.mouse.fillColor) octx.fill();
    }

    octx.stroke();
    octx.closePath();
    octx.restore();
  },

  clearHit: function() {
    var prevHit = this.prevHit,
      plotOffset = this.plotOffset,
      s = prevHit.series,
      xa = prevHit.xaxis,
      ya = prevHit.yaxis,
      lw = s.bars.lineWidth,
      bw = s.bars.barWidth;
        
    if(!s.bars.horizontal){ // vertical bars (default)
      var lastY = ya.d2p(prevHit.y >= 0 ? prevHit.y : 0);
      if(s.bars.centered) {
        this.octx.clearRect(
            xa.d2p(prevHit.x - bw/2) + plotOffset.left - lw, 
            lastY + plotOffset.top - lw, 
            xa.d2p(bw + xa.min) + lw * 2, 
            ya.d2p(prevHit.y < 0 ? prevHit.y : 0) - lastY + lw * 2
        );
      } else {
        this.octx.clearRect(
            xa.d2p(prevHit.x) + plotOffset.left - lw, 
            lastY + plotOffset.top - lw, 
            xa.d2p(bw + xa.min) + lw * 2, 
            ya.d2p(prevHit.y < 0 ? prevHit.y : 0) - lastY + lw * 2
        ); 
      }
    } else { // horizontal bars
      var lastX = xa.d2p(prevHit.x >= 0 ? prevHit.x : 0);
      if(s.bars.centered) {
        this.octx.clearRect(
            lastX + plotOffset.left + lw, 
            ya.d2p(prevHit.y + bw/2) + plotOffset.top - lw, 
            xa.d2p(prevHit.x < 0 ? prevHit.x : 0) - lastX - lw*2,
            ya.d2p(bw + ya.min) + lw * 2
        );
      } else {
        this.octx.clearRect(
            lastX + plotOffset.left + lw, 
            ya.d2p(prevHit.y + bw) + plotOffset.top - lw, 
            xa.d2p(prevHit.x < 0 ? prevHit.x : 0) - lastX - lw*2,
            ya.d2p(bw + ya.min) + lw * 2
        );
      }
    }
  }
});
