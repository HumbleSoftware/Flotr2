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
    
    ctx.save();
    this.bars.plotShadows(series, bw, 0, series.bars.fill);
    ctx.restore();
    
    if(series.bars.fill){
      var color = series.bars.fillColor || series.color;
      ctx.fillStyle = this.processColor(color, {opacity: series.bars.fillOpacity});
    }
    
    this.bars.plot(series, bw, 0, series.bars.fill);
    ctx.restore();
  },
  plot: function(series, barWidth, offset, fill){
    var data = series.data;
    if(data.length < 1) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx, i;

    for(i = 0; i < data.length; i++){
      var x = data[i][0],
          y = data[i][1],
        drawLeft = true, drawTop = true, drawRight = true;
      
      if (y === null) continue;
      
      // Stacked bars
      var stackOffsetPos = 0;
      var stackOffsetNeg = 0;
      
      if(series.bars.stacked) {
        if(series.bars.horizontal) {
          stackOffsetPos = ya.values[y].stackPos || 0;
          stackOffsetNeg = ya.values[y].stackNeg || 0;
          if(x > 0) {
            ya.values[y].stackPos = stackOffsetPos + x;
          } else {
            ya.values[y].stackNeg = stackOffsetNeg + x;
          }
        } 
        else {
          stackOffsetPos = xa.values[x].stackPos || 0;
          stackOffsetNeg = xa.values[x].stackNeg || 0;
          if(y > 0) {
            xa.values[x].stackPos = stackOffsetPos + y;
          } else {
            xa.values[x].stackNeg = stackOffsetNeg + y;
          }
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

      if(left < xa.min){
        left = xa.min;
        drawLeft = false;
      }

      if(right > xa.max){
        right = xa.max;
        if (xa.lastSerie != series && series.bars.horizontal)
          drawTop = false;
      }

      if(bottom < ya.min)
        bottom = ya.min;

      if(top > ya.max){
        top = ya.max;
        if (ya.lastSerie != series && !series.bars.horizontal)
          drawTop = false;
      }
      
      // Cache d2p values
      var xaLeft   = xa.d2p(left),
          xaRight  = xa.d2p(right),
          yaTop    = ya.d2p(top), 
          yaBottom = ya.d2p(bottom);

      /**
       * Fill the bar.
       */
      if(fill){
        ctx.fillRect(xaLeft, yaTop, xaRight - xaLeft, yaBottom - yaTop);
      }

      /**
       * Draw bar outline/border.
       * @todo  Optimize this with rect method ?
       * @todo  Can we move stroke, beginPath, closePath out of the main loop?
       *        Not sure if rect screws this up.
       */
      if(series.bars.lineWidth != 0 && (drawLeft || drawRight || drawTop)){
        ctx.beginPath();
        ctx.moveTo(xaLeft, yaBottom + offset);
        
        ctx[drawLeft ?'lineTo':'moveTo'](xaLeft, yaTop + offset);
        ctx[drawTop  ?'lineTo':'moveTo'](xaRight, yaTop + offset);
        ctx[drawRight?'lineTo':'moveTo'](xaRight, yaBottom + offset);
                 
        ctx.stroke();
        ctx.closePath();
      }
    }
  },
  plotShadows: function(series, barWidth, offset){
    var data = series.data;
    if(data.length < 1) return;
    
    var i, x, y, 
        xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        sw = this.options.shadowSize;
    
    for(i = 0; i < data.length; i++){
      x = data[i][0];
        y = data[i][1];
        
      if (y === null) continue;
      
      // Stacked bars
      var stackOffsetPos = 0;
      var stackOffsetNeg = 0;
      
      // TODO reconcile this with the same logic in Plot, maybe precalc
      if(series.bars.stacked) {
        if(series.bars.horizontal) {
          stackOffsetPos = ya.values[y].stackShadowPos || 0;
          stackOffsetNeg = ya.values[y].stackShadowNeg || 0;
          if(x > 0) {
            ya.values[y].stackShadowPos = stackOffsetPos + x;
          } else {
            ya.values[y].stackShadowNeg = stackOffsetNeg + x;
          }
        }
        else {
          stackOffsetPos = xa.values[x].stackShadowPos || 0;
          stackOffsetNeg = xa.values[x].stackShadowNeg || 0;
          if(y > 0) {
            xa.values[x].stackShadowPos = stackOffsetPos + y;
          } else {
            xa.values[x].stackShadowNeg = stackOffsetNeg + y;
          }
        }
      }
      
      // Horizontal bars
      var barOffset = series.bars.centered ? barWidth/2 : 0;
      
      if(series.bars.horizontal){
        if (x > 0)
          var left = stackOffsetPos, right = x + stackOffsetPos;
        else
          var right = stackOffsetNeg, left = x + stackOffsetNeg;
          
        var bottom = y- barOffset, top = y + barWidth - barOffset;
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
      
      if(left < xa.min)   left = xa.min;
      if(right > xa.max)  right = xa.max;
      if(bottom < ya.min) bottom = ya.min;
      if(top > ya.max)    top = ya.max;
      
      var width =  xa.d2p(right)-xa.d2p(left)-((xa.d2p(right)+sw <= this.plotWidth) ? 0 : sw);
      var height = ya.d2p(bottom)-ya.d2p(top)-((ya.d2p(bottom)+sw <= this.plotHeight) ? 0 : sw );
      
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(Math.min(xa.d2p(left)+sw, this.plotWidth), Math.min(ya.d2p(top)+sw, this.plotHeight), width, height);
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
  clearHit: function(s) {
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
  },
  findAxesValues: function(s){
    this.findXAxesValues(s);
    if(s.bars.show && s.bars.horizontal && s.bars.stacked)
      this.findYAxesValues(s);
  }
});
