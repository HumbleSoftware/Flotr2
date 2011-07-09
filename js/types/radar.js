/** Radar **/
Flotr.addType('radar', {
  options: {
    show: false,           // => setting to true will show radar chart, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    radiusRatio: 0.90      // => ratio of the radar, against the plot size
  },
  draw: function(series){
    var ctx = this.ctx,
        options = this.options;
    
    ctx.save();
    ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
    ctx.lineWidth = series.radar.lineWidth;
    
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    this.radar.plot(series, series.shadowSize / 2);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    this.radar.plot(series, series.shadowSize / 4);
    
    ctx.strokeStyle = series.color;
    ctx.fillStyle = this.processColor(series.color, {opacity: series.radar.fillOpacity});
    this.radar.plot(series);
    
    ctx.restore();
  },
  plot: function(series, offset){
    var ctx = this.ctx,
        options = this.options,
        data = series.data,
        radius = Math.min(this.plotHeight, this.plotWidth)*options.radar.radiusRatio/2,
        coeff = 2*(Math.PI/data.length),
        angle = -Math.PI/2;
        
    offset = offset || 0;
    
    ctx.beginPath();
    for(var i = 0; i < data.length; ++i){
      var x = data[i][0],
          y = data[i][1],
          ratio = y / this.axes.y.max;

      ctx[i == 0 ? 'moveTo' : 'lineTo'](Math.cos(i*coeff+angle)*radius*ratio + offset, Math.sin(i*coeff+angle)*radius*ratio + offset);
    }
    ctx.closePath();
    if (series.radar.fill) ctx.fill();
    ctx.stroke();
  }
});
