/** Bubbles **/
Flotr.addType('bubbles', {
  options: {
    show: false,      // => setting to true will show radar chart, false will hide
    lineWidth: 2,     // => line width in pixels
    fill: true,       // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillOpacity: 0.4, // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    baseRadius: 2     // => ratio of the radar, against the plot size
  },
  draw: function(series){
    var ctx = this.ctx,
        options = this.options;
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineWidth = series.bubbles.lineWidth;
    
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    this.bubbles.plot(series, series.shadowSize / 2);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    this.bubbles.plot(series, series.shadowSize / 4);
    
    ctx.strokeStyle = series.color;
    ctx.fillStyle = this.processColor(series.color, {opacity: series.radar.fillOpacity});
    this.bubbles.plot(series);
    
    ctx.restore();
  },
  plot: function(series, offset){
    var ctx = this.ctx,
        options = this.options,
        data = series.data,
        radius = options.bubbles.baseRadius;
        
    offset = offset || 0;
    
    for(var i = 0; i < data.length; ++i){
      var x = data[i][0],
          y = data[i][1],
          z = data[i][2];
          
      ctx.beginPath();
      ctx.arc(series.xaxis.d2p(x) + offset, series.yaxis.d2p(y) + offset, radius * z, 0, Math.PI*2, true);
      ctx.stroke();
      if (series.bubbles.fill) ctx.fill();
      ctx.closePath();
    }
  },
  drawHit: function(n){

    var octx = this.octx,
        s = n.series,
        xa = n.xaxis,
        ya = n.yaxis,
        z = s.data[0][2],
        r = this.options.bubbles.baseRadius;

    octx.save();
    octx.lineWidth = s.points.lineWidth;
    octx.strokeStyle = s.mouse.lineColor;
    octx.fillStyle = this.processColor(s.mouse.fillColor || '#ffffff', {opacity: s.mouse.fillOpacity});

    octx.translate(this.plotOffset.left, this.plotOffset.top);
    octx.beginPath();
      octx.arc(xa.d2p(n.x), ya.d2p(n.y), z*r, 0, 2 * Math.PI, true);
      octx.fill();
      octx.stroke();
    octx.closePath();
    octx.restore();
  },
  clearHit: function(){
    var prevHit = this.prevHit,
        plotOffset = this.plotOffset,
        s = prevHit.series,
        lw = s.bars.lineWidth,
        xa = prevHit.xaxis,
        ya = prevHit.yaxis,
        z = s.data[0][2],
        r = this.options.bubbles.baseRadius,
        offset = z*r+lw;

    this.octx.clearRect(
      plotOffset.left + xa.d2p(prevHit.x) - offset,
      plotOffset.top  + ya.d2p(prevHit.y) - offset,
      offset*2,
      offset*2
    );
  }

/*,
  extendXRange: function(axis){
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, c, r, data, d;
          
      for(i = 0; i < this.series.length; ++i){
        c = this.series[i].bubbles;
        if(c.show && this.series[i].xaxis == axis) {
          data = this.series[i].data;
          if (data)
          for(j = 0; j < data.length; j++) {
            d = data[j];
            r = d[2] * c.baseRadius * (this.plotWidth / (axis.datamax - axis.datamin));
              newmax = Math.max(d[0] + r, newmax);
              newmin = Math.min(d[0] - r, newmin);
          }
        }
      }
      axis.max = newmax;
      axis.min = newmin;
    }
  },
  extendYRange: function(axis){
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, c, r, data, d;

      for(i = 0; i < this.series.length; ++i){
        c = this.series[i].bubbles;
        if(c.show && this.series[i].yaxis == axis) {
          data = this.series[i].data;
          if (data)
          for(j = 0; j < data.length; j++) {
            d = data[j];
            r = d[2] * c.baseRadius;
            newmax = Math.max(d[1] + r, newmax);
            newmin = Math.min(d[1] - r, newmin);
          }
        }
      }
      axis.max = newmax;
      axis.min = newmin;
    }
  }*/
});
