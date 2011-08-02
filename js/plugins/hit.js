(function () {

var D = Flotr.DOM;

Flotr.addPlugin('hit', {
  callbacks: {
    'flotr:mousemove': function(e, pos) {
      if(this.selectionInterval == null && 
          (this.options.mouse.track || _.any(this.series, function(s){return s.mouse && s.mouse.track;})))
        this.hit.hit(pos);
    },
    'mouseout': function() {
      this.hit.clearHit();
    }
  },
  /**
   * Updates the mouse tracking point on the overlay.
   */
  drawHit: function(n){
    var octx = this.octx,
      s = n.series;

    if(s.mouse.lineColor != null){
      octx.save();
      octx.lineWidth = (s.points ? s.points.lineWidth : 1);
      octx.strokeStyle = s.mouse.lineColor;
      octx.fillStyle = this.processColor(s.mouse.fillColor || '#ffffff', {opacity: s.mouse.fillOpacity});

      if (!this.executeOnType(s, 'drawHit', [n])) {
        var xa = n.xaxis,
          ya = n.yaxis;

        octx.translate(this.plotOffset.left, this.plotOffset.top);
        octx.beginPath();
          octx.arc(xa.d2p(n.x), ya.d2p(n.y), s.mouse.radius, 0, 2 * Math.PI, true);
          octx.fill();
          octx.stroke();
        octx.closePath();
      }
      octx.restore();
    }
    this.prevHit = n;
  },
  /**
   * Removes the mouse tracking point from the overlay.
   */
  clearHit: function(){
    var prev = this.prevHit;
    if(prev && !this.executeOnType(prev.series, 'clearHit')){
      var plotOffset = this.plotOffset,
        s = prev.series,
        lw = (s.bars ? s.bars.lineWidth : 1),
        offset = s.mouse.radius + lw;
      this.octx.clearRect(
        plotOffset.left + prev.xaxis.d2p(prev.x) - offset,
        plotOffset.top  + prev.yaxis.d2p(prev.y) - offset,
        offset*2,
        offset*2
      );
    }
  },
  /**
   * Retrieves the nearest data point from the mouse cursor. If it's within
   * a certain range, draw a point on the overlay canvas and display the x and y
   * value of the data.
   * @param {Object} mouse - Object that holds the relative x and y coordinates of the cursor.
   */
  hit: function(mouse){
    var series = this.series,
      options = this.options,
      prevHit = this.prevHit,
      plotOffset = this.plotOffset,
      octx = this.octx, 
      data, sens, xsens, ysens, x, y, xa, ya, mx, my, i,
      /**
       * Nearest data element.
       */
      n = {
        dist:Number.MAX_VALUE,
        x:null,
        y:null,
        relX:mouse.relX,
        relY:mouse.relY,
        absX:mouse.absX,
        absY:mouse.absY,
        sAngle:null,
        eAngle:null,
        fraction: null,
        mouse:null,
        xaxis:null,
        yaxis:null,
        series:null,
        index:null,
        seriesIndex:null
      };

    if (options.mouse.trackAll) {
      for(i = 0; i < series.length; i++){
        s = series[0];
        data = s.data;
        xa = s.xaxis;
        ya = s.yaxis;
        xsens = (2*options.points.lineWidth)/xa.scale * s.mouse.sensibility;
        mx = xa.p2d(mouse.relX);
        my = ya.p2d(mouse.relY);
    
        for(var j = 0; j < data.length; j++){
          x = data[j][0];
          y = data[j][1];
    
          if (y === null ||
              xa.min > x || xa.max < x ||
              ya.min > y || ya.max < y ||
              mx < xa.min || mx > xa.max ||
              my < ya.min || my > ya.max) continue;
    
          var xdiff = Math.abs(x - mx);
    
          // Bars and Pie are not supported yet. Not sure how it should look with bars or Pie
          if((!s.bars.show && xdiff < xsens) 
              || (s.bars.show && xdiff < s.bars.barWidth/2) 
              || (y < 0 && my < 0 && my > y)) {
            
            var distance = xdiff;
            
            if (distance < n.dist) {
              n.dist = distance;
              n.x = x;
              n.y = y;
              n.xaxis = xa;
              n.yaxis = ya;
              n.mouse = s.mouse;
              n.series = s; 
              n.allSeries = series; // include all series
              n.index = j;
            }
          }
        }
      }
    }
    else if(!this.executeOnType(series, 'hit', [mouse, n])) {
      for(i = 0; i < series.length; i++){
        s = series[i];
        if(!s.mouse.track) continue;
        
        data = s.data;
        xa = s.xaxis;
        ya = s.yaxis;
        sens = 2 * (options.points ? options.points.lineWidth : 1) * s.mouse.sensibility;
        xsens = sens/xa.scale;
        ysens = sens/ya.scale;
        mx = xa.p2d(mouse.relX);
        my = ya.p2d(mouse.relY);
        
        //if (s.points) {
        //  var h = this.points.getHit(s, mouse);
        //  if (h.index !== undefined) console.log(h);
        //}
                
        for(var j = 0, xpow, ypow; j < data.length; j++){
          x = data[j][0];
          y = data[j][1];
          
          if (y === null || 
              xa.min > x || xa.max < x || 
              ya.min > y || ya.max < y) continue;
          
          if(s.bars.show && s.bars.centered){
            var xdiff = Math.abs(x - mx),
              ydiff = Math.abs(y - my);
          } else {
            if (s.bars.horizontal){
              var xdiff = Math.abs(x - mx),
                ydiff = Math.abs(y + s.bars.barWidth/2 - my);
            } else {
              var xdiff = Math.abs(x + s.bars.barWidth/2 - mx),
                ydiff = Math.abs(y - my);
            }
          }
          
          // we use a different set of criteria to determin if there has been a hit
          // depending on what type of graph we have
          if(((!s.bars.show) && xdiff < xsens && (!s.mouse.trackY || ydiff < ysens)) ||
              // Bars check
              (s.bars.show && (!s.bars.horizontal && xdiff < s.bars.barWidth/2 + 1/xa.scale // Check x bar boundary, with adjustment for scale (when bars ~1px)
              && (!s.mouse.trackY || (y > 0 && my > 0 && my < y) || (y < 0 && my < 0 && my > y))) 
              || (s.bars.horizontal && ydiff < s.bars.barWidth/2 + 1/ya.scale // Check x bar boundary, with adjustment for scale (when bars ~1px)
              && ((x > 0 && mx > 0 && mx < x) || (x < 0 && mx < 0 && mx > x))))){ // for horizontal bars there is need to use y-axis tracking, so s.mouse.trackY is ignored
            
            var distance = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
            if(distance < n.dist){
              n.dist = distance;
              n.x = x;
              n.y = y;
              n.xaxis = xa;
              n.yaxis = ya;
              n.mouse = s.mouse;
              n.series = s;
              n.allSeries = series;
              n.index = j;
              n.seriesIndex = i;
            }
          }
        }
      }
    }
    
    if(n.series && (n.mouse && n.mouse.track && !prevHit || (prevHit /*&& (n.x != prevHit.x || n.y != prevHit.y)*/))){
      var mt = this.getMouseTrack(),
          pos = '', 
          s = n.series,
          p = n.mouse.position, 
          m = n.mouse.margin,
          elStyle = 'opacity:0.7;background-color:#000;color:#fff;display:none;position:absolute;padding:2px 8px;-moz-border-radius:4px;border-radius:4px;white-space:nowrap;';
      
      if (!n.mouse.relative) { // absolute to the canvas
             if(p.charAt(0) == 'n') pos += 'top:' + (m + plotOffset.top) + 'px;bottom:auto;';
        else if(p.charAt(0) == 's') pos += 'bottom:' + (m + plotOffset.bottom) + 'px;top:auto;';
             if(p.charAt(1) == 'e') pos += 'right:' + (m + plotOffset.right) + 'px;left:auto;';
        else if(p.charAt(1) == 'w') pos += 'left:' + (m + plotOffset.left) + 'px;right:auto;';
      }
      else { // relative to the mouse or in the case of bar like graphs to the bar
        if(!s.bars.show && !s.pie.show){
               if(p.charAt(0) == 'n') pos += 'bottom:' + (m - plotOffset.top - n.yaxis.d2p(n.y) + this.canvasHeight) + 'px;top:auto;';
          else if(p.charAt(0) == 's') pos += 'top:' + (m + plotOffset.top + n.yaxis.d2p(n.y)) + 'px;bottom:auto;';
               if(p.charAt(1) == 'e') pos += 'left:' + (m + plotOffset.left + n.xaxis.d2p(n.x)) + 'px;right:auto;';
          else if(p.charAt(1) == 'w') pos += 'right:' + (m - plotOffset.left - n.xaxis.d2p(n.x) + this.canvasWidth) + 'px;left:auto;';
        }

        else if (s.bars.show) {
          pos += 'bottom:' + (m - plotOffset.top - n.yaxis.d2p(n.y/2) + this.canvasHeight) + 'px;top:auto;';
          pos += 'left:' + (m + plotOffset.left + n.xaxis.d2p(n.x - options.bars.barWidth/2)) + 'px;right:auto;';
        }
        else {
          var center = {
            x: (this.plotWidth)/2,
            y: (this.plotHeight)/2
          },
          radius = (Math.min(this.canvasWidth, this.canvasHeight) * s.pie.sizeRatio) / 2,
          bisection = n.sAngle<n.eAngle ? (n.sAngle + n.eAngle) / 2: (n.sAngle + n.eAngle + 2* Math.PI) / 2;
          
          pos += 'bottom:' + (m - plotOffset.top - center.y - Math.sin(bisection) * radius/2 + this.canvasHeight) + 'px;top:auto;';
          pos += 'left:' + (m + plotOffset.left + center.x + Math.cos(bisection) * radius/2) + 'px;right:auto;';
        }
      }
      elStyle += pos;

      mt.style.cssText = elStyle;

      if(n.x !== null && n.y !== null){
        D.show(mt);
        
        this.hit.clearHit();
        this.hit.drawHit(n);
        
        var decimals = n.mouse.trackDecimals;
        if(decimals == null || decimals < 0) decimals = 0;
        
        mt.innerHTML = n.mouse.trackFormatter({
          x: n.x.toFixed(decimals), 
          y: n.y.toFixed(decimals), 
          series: n.series, 
          index: n.index,
          nearest: n,
          fraction: n.fraction
        });
        Flotr.EventAdapter.fire(mt, 'flotr:hit', [n, this]);
      }
      else if(prevHit){
        D.hide(mt);
        this.clearHit();
      }
    }
    else if(this.prevHit) {
      D.hide(this.mouseTrack);
      this.hit.clearHit();
    }
  }
});
})();
