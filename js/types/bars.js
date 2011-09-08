/** Bars **/
Flotr.addType('bars', {

  options: {
    show: false,           // => setting to true will show bars, false will hide
    lineWidth: 2,          // => in pixels
    barWidth: 1,           // => in units of the x axis
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    horizontal: false,     // => horizontal bars (x and y inverted) @todo: needs fix
    stacked: false,        // => stacked bar charts
    centered: true         // => center the bars to their x axis value
  },

  /**
   * Draws bar series in the canvas element.
   * @param {Object} series - Series with options.bars.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
      bw = series.bars.barWidth,
      lw = Math.min(series.bars.lineWidth, bw);
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'miter';

    /**
     * @todo linewidth not interpreted the right way.
     */
    ctx.lineWidth = lw;
    ctx.strokeStyle = series.color;
    
    if(series.bars.fill){
      var color = series.bars.fillColor || series.color;
      ctx.fillStyle = this.processColor(color, {opacity: series.bars.fillOpacity});
    }
    
    this.bars.plot(series, bw, 0, series.bars.fill);
    ctx.restore();
  },

  getStack: function (series) {
    var stack = false;
    if(series.bars.stacked) {
      stack = (series.bars.horizontal ? series.yaxis : series.xaxis).getStack('bars');
      if (_.isEmpty(stack)) {
        stack.positive = [];
        stack.negative = [];
        stack._positive = []; // Shadow
        stack._negative = []; // Shadow
      }
    }

    return stack;
  },

  plot: function(series, barWidth, offset, fill){
    if(series.data.length < 1) return;
    
    var data = series.data,
      xa = series.xaxis,
      ya = series.yaxis,
      ctx = this.ctx,
      stack = this.bars.getStack(series),
      shadowSize = this.options.shadowSize,
      i, stackIndex, stackValue;

    for(i = 0; i < data.length; i++){
      var x = data[i][0],
          y = data[i][1];
      
      if (y === null) continue;
      
      // Stacked bars
      var stackOffsetPos = 0;
      var stackOffsetNeg = 0;

      if (stack) {

        if(series.bars.horizontal) {
          stackIndex = y;
          stackValue = x;
        } else {
          stackIndex = x;
          stackValue = y;
        }

        stackOffsetPos = stack.positive[stackIndex] || 0;
        stackOffsetNeg = stack.negative[stackIndex] || 0;

        if (stackValue > 0) {
          stack.positive[stackIndex] = stackOffsetPos + stackValue;
        } else {
          stack.negative[stackIndex] = stackOffsetNeg + stackValue;
        }
      }
      
      // @todo: fix horizontal bars support
      // Horizontal bars
      var barOffset = series.bars.centered ? barWidth/2 : 0;
      
      if(series.bars.horizontal){ 
        if (x > 0)
          var left = stackOffsetPos, right = x + stackOffsetPos;
        else
          var right = stackOffsetNeg, left = x + stackOffsetNeg;
          
        var bottom = y - barOffset, top = y + barWidth - barOffset;
      }
      else {
        if (y > 0)
          var bottom = stackOffsetPos, top = y + stackOffsetPos;
        else
          var top = stackOffsetNeg, bottom = y + stackOffsetNeg;
          
        var left = x - barOffset, right = x + barWidth - barOffset;
      }
      
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;

      if (left < xa.min){
        left = xa.min;
      }

      if(right > xa.max){
        right = xa.max;
      }

      if(bottom < ya.min)
        bottom = ya.min;

      if(top > ya.max){
        top = ya.max;
      }
      
      // Cache d2p values
      var xaLeft   = xa.d2p(left),
          xaRight  = xa.d2p(right),
          yaTop    = ya.d2p(top), 
          yaBottom = ya.d2p(bottom);
          width    = xaRight - xaLeft,
          height   = yaBottom - yaTop;

      if (fill){
        ctx.fillRect(xaLeft, yaTop, width, height);
      }

      if (shadowSize) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(xaLeft + shadowSize, yaTop + shadowSize, width, height);
        ctx.restore();
      }

      if (series.bars.lineWidth != 0) {
        ctx.strokeRect(xaLeft, yaTop, width, height);
      }
    }
  },

  extendXRange: function(axis) {
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, x, s, b,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;

      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        b = s.bars;
        if(b.show && s.xaxis == axis) {
          if (b.centered && !b.horizontal) {
            newmax = Math.max(axis.datamax + 0.5, newmax);
            newmin = Math.min(axis.datamin - 0.5, newmin);
          }
          
          // For normal vertical bars
          if (!b.horizontal && (b.barWidth + axis.datamax > newmax))
            newmax = axis.max + (b.centered ? b.barWidth/2 : b.barWidth);

          // For horizontal stacked bars
          if(b.stacked && b.horizontal){
            for (j = 0; j < s.data.length; j++) {
              if (b.show && b.stacked) {
                y = s.data[j][1]+'';
                
                if(s.data[j][0] > 0)
                  stackedSumsPos[y] = (stackedSumsPos[y] || 0) + s.data[j][0];
                else
                  stackedSumsNeg[y] = (stackedSumsNeg[y] || 0) + s.data[j][0];
                  
                lastSerie = s;
              }
            }

            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
            for (j in stackedSumsNeg) {
              newmin = Math.min(stackedSumsNeg[j], newmin);
            }
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  },

  extendYRange: function(axis){
    if(axis.options.max == null){
      var newmax = axis.max,
          newmin = axis.min,
          x, i, j, s, b,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;
                  
      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        b = s.bars;
        if (b.show && !s.hide && s.yaxis == axis) {
          if (b.centered && b.horizontal) {
            newmax = Math.max(axis.datamax + 0.5, newmax);
            newmin = Math.min(axis.datamin - 0.5, newmin);
          }
              
          // For normal horizontal bars
          if (b.horizontal && (b.barWidth + axis.datamax > newmax)){
            newmax = axis.max + b.barWidth;
          }
          
          // For vertical stacked bars
          if(b.stacked && !b.horizontal){
            for (j = 0; j < s.data.length; j++) {
              if (s.bars.show && s.bars.stacked) {
                x = s.data[j][0]+'';
                
                if(s.data[j][1] > 0)
                  stackedSumsPos[x] = (stackedSumsPos[x] || 0) + s.data[j][1];
                else
                  stackedSumsNeg[x] = (stackedSumsNeg[x] || 0) + s.data[j][1];
                  
                lastSerie = s;
              }
            }
            
            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
            for (j in stackedSumsNeg) {
              newmin = Math.min(stackedSumsNeg[j], newmin);
            }
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  },

  drawHit: function (n) {
    var octx = this.octx,
      s = n.series,
      xa = n.xaxis,
      ya = n.yaxis;

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
        var ly = ya.d2p(ya.min<0? 0 : ya.min); //lower vertex y value (in points)
        
        if(s.bars.centered){
          var lx = xa.d2p(n.x-(bw/2)),
            rx = xa.d2p(n.x+(bw/2));
        
          octx.moveTo(lx, ly);
          octx.lineTo(lx, y);
          octx.lineTo(rx, y);
          octx.lineTo(rx, ly);
        } else {
          var rx = xa.d2p(n.x+bw); //right vertex x value (in points)
          
          octx.moveTo(x, ly);
          octx.lineTo(x, y);
          octx.lineTo(rx, y);
          octx.lineTo(rx, ly);
        }
      } else { //horizontal bars
        var lx = xa.d2p(xa.min<0? 0 : xa.min); //left vertex y value (in points)
          
        if(s.bars.centered){
          var ly = ya.d2p(n.y-(bw/2)),
            uy = ya.d2p(n.y+(bw/2));
                       
          octx.moveTo(lx, ly);
          octx.lineTo(x, ly);
          octx.lineTo(x, uy);
          octx.lineTo(lx, uy);
        } else {
          var uy = ya.d2p(n.y+bw); //upper vertex y value (in points)
        
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
