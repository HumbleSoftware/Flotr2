/** Bubbles **/
Flotr.addType('bubbles', {
  options: {
    show: false,      // => setting to true will show radar chart, false will hide
    lineWidth: 2,     // => line width in pixels
    fill: true,       // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillOpacity: 0.4, // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    baseRadius: 2     // => ratio of the radar, against the plot size
  },
  draw : function (options) {
    var
      context     = options.context,
      offsetLeft  = options.offsetLeft,
      offsetTop   = options.offsetTop,
      lineWidth   = options.lineWidth,
      shadowSize  = options.shadowSize;

    context.save();
    context.translate(offsetLeft, offsetTop);
    context.lineWidth = lineWidth;
    
    // Shadows
    context.fillStyle = 'rgba(0,0,0,0.05)';
    context.strokeStyle = 'rgba(0,0,0,0.05)';
    this.plot(options, shadowSize / 2);
    context.strokeStyle = 'rgba(0,0,0,0.1)';
    this.plot(options, shadowSize / 4);

    // Chart
    context.strokeStyle = options.color;
    context.fillStyle = options.fillStyle;
    this.plot(options);
    
    context.restore();
  },
  plot : function (options, offset) {

    var
      data    = options.data,
      context = options.context,
      radius  = options.baseRadius,
      xScale  = options.xScale,
      yScale  = options.yScale,
      fill    = options.fill,
      i, x, y, z;

    offset = offset || 0;
    
    for (i = 0; i < data.length; ++i){

      x = xScale(data[i][0]) + offset,
      y = yScale(data[i][1]) + offset,
      z = data[i][2] * radius;

      context.beginPath();
      context.arc(x, y, z, 0, Math.PI*2, true);
      context.stroke();
      if (fill) context.fill();
      context.closePath();
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
