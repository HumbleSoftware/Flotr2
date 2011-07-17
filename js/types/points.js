/** Points **/
Flotr.addType('points', {
  options: {
    show: false,           // => setting to true will show points, false will hide
    radius: 3,             // => point radius (pixels)
    lineWidth: 2,          // => line width in pixels
    fill: true,            // => true to fill the points with a color, false for (transparent) no fill
    fillColor: '#FFFFFF',  // => fill color
    fillOpacity: 0.4       // => opacity of color inside the points
  },
  /**
   * Draws point series in the canvas element.
   * @param {Object} series - Series with options.points.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
        lw = series.lines.lineWidth,
        sw = series.shadowSize;
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    
    if(sw > 0){
      ctx.lineWidth = sw / 2;
      
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      this.points.plotShadows(series, sw/2 + ctx.lineWidth/2, series.points.radius);

      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      this.points.plotShadows(series, ctx.lineWidth/2, series.points.radius);
    }

    ctx.lineWidth = series.points.lineWidth;
    ctx.strokeStyle = series.color;
    ctx.fillStyle = series.points.fillColor ? series.points.fillColor : series.color;
    this.points.plot(series, series.points.radius, series.points.fill);
    ctx.restore();
  },
  plot: function (series, radius, fill) {
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        data = series.data,
        i, x, y;
      
    for(i = data.length - 1; i > -1; --i){
      x = data[i][0];
      y = data[i][1];
      // To allow empty values
      if(y === null || x < xa.min || x > xa.max || y < ya.min || y > ya.max)
        continue;
      
      ctx.beginPath();
      ctx.arc(xa.d2p(x), ya.d2p(y), radius, 0, 2 * Math.PI, true);
      if(fill) ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  },
  plotShadows: function(series, offset, radius){
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        data = series.data,
        i, x, y;
      
    for(i = data.length - 1; i > -1; --i){
      x = data[i][0];
      y = data[i][1];
      if (y === null || x < xa.min || x > xa.max || y < ya.min || y > ya.max)
        continue;
      ctx.beginPath();
      ctx.arc(xa.d2p(x), ya.d2p(y) + offset, radius, 0, Math.PI, false);
      ctx.stroke();
      ctx.closePath();
    }
  },
  getHit: function(series, pos) {
    var xdiff, ydiff, i, d, dist, x, y,
        o = series.points,
        data = series.data,
        sens = series.mouse.sensibility * (o.lineWidth + o.radius),
        hit = {
        index: null,
        series: series,
        distance: Number.MAX_VALUE,
        x: null,
        y: null,
        precision: 1
        };
    
    for (i = data.length-1; i > -1; --i) {
      d = data[i];
      x = series.xaxis.d2p(d[0]);
      y = series.yaxis.d2p(d[1]);
      xdiff = x - pos.relX;
      ydiff = y - pos.relY;
      dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
      
      if (dist < sens && dist < hit.distance) {
        hit = {
          index: i,
          series: series,
          distance: dist,
          data: d,
          x: x,
          y: y,
          precision: 1
        };
      }
    }
    
    return hit;
  },
  drawHit: function(series, index) {
    
  },
  clearHit: function(series, index) {
    
  }
});
