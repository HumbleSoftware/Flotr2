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
      shadowSize  = options.shadowSize;

    context.save();
    context.translate(options.offsetLeft, options.offsetTop);
    context.lineWidth = options.lineWidth;
    
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
      i, x, y, z;

    offset = offset || 0;
    
    for (i = 0; i < data.length; ++i){

      x = options.xScale(data[i][0]) + offset,
      y = options.yScale(data[i][1]) + offset,
      z = data[i][2] * options.baseRadius;

      context.beginPath();
      context.arc(x, y, z, 0, Math.PI*2, true);
      context.stroke();
      if (options.fill) context.fill();
      context.closePath();
    }
  },
  drawHit : function (options) {

    var
      data    = options.data,
      args    = options.args,
      context = options.context,
      x       = options.xScale(args.x),
      y       = options.yScale(args.y),
      z       = data[args.index][2] * options.baseRadius;

    context.save();
    context.lineWidth = options.lineWidth;
    context.fillStyle = options.fillStyle;
    context.strokeStyle = options.color;
    context.translate(options.offsetLeft, options.offsetTop);
    context.beginPath();
    context.arc(x, y, z, 0, 2 * Math.PI, true);
    context.fill();
    context.stroke();
    context.closePath();
    context.restore();
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

    this.context.clearRect(
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
