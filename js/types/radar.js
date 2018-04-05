/** Radar **/
Flotr.addType('radar', {
  options: {
    show: false,           // => setting to true will show radar chart, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    radiusRatio: 0.90,      // => ratio of the radar, against the plot size
    sensibility: 2         // => the lower this number, the more precise you have to aim to show a value.
  },
  draw : function (options) {
    var
      context = options.context,
      shadowSize = options.shadowSize;

    context.save();
    context.translate(options.width / 2, options.height / 2);
    context.lineWidth = options.lineWidth;
    
    // Shadow
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
      radius  = Math.min(options.height, options.width) * options.radiusRatio / 2,
      step    = 2 * Math.PI / data.length,
      angle   = -Math.PI / 2,
      i, ratio;

    offset = offset || 0;

    context.beginPath();
    for (i = 0; i < data.length; ++i) {
      ratio = data[i][1] / this.max;

      context[i === 0 ? 'moveTo' : 'lineTo'](
        Math.cos(i * step + angle) * radius * ratio + offset,
        Math.sin(i * step + angle) * radius * ratio + offset
      );
    }
    context.closePath();
    if (options.fill) context.fill();
    context.stroke();
  },
  getGeometry : function (point, options) {
    var
      radius  = Math.min(options.height, options.width) * options.radiusRatio / 2,
      step    = 2 * Math.PI / options.data.length,
      angle   = -Math.PI / 2,
      ratio = point[1] / this.max;

    return {
      x : (Math.cos(point[0] * step + angle) * radius * ratio) + options.width / 2,
      y : (Math.sin(point[0] * step + angle) * radius * ratio) + options.height / 2
    };
  },
  hit : function (options) {
    var
      args = options.args,
      mouse = args[0],
      n = args[1],
      relX = mouse.relX,
      relY = mouse.relY,
      distance,
      geometry,
      dx, dy;

      for (var i = 0; i < n.series.length; i++) {
        var serie = n.series[i];
        var data = serie.data;

        for (var j = data.length; j--;) {
          geometry = this.getGeometry(data[j], options);

          dx = geometry.x - relX;
          dy = geometry.y - relY;
          distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <  options.sensibility*2) {
            n.x = data[j][0];
            n.y = data[j][1];
            n.index = j;
            n.seriesIndex = i;
            return n;
          }
        }
      }
    },
  drawHit : function (options) {
    var step = 2 * Math.PI / options.data.length;
    var angle   = -Math.PI / 2;
    var radius  = Math.min(options.height, options.width) * options.radiusRatio / 2;

    var s = options.args.series;
    var point_radius = s.points.hitRadius || s.points.radius || s.mouse.radius;

    var context = options.context;

    context.translate(options.width / 2, options.height / 2);

    var j = options.args.index;
    var ratio = options.data[j][1] / this.max;
    var x = Math.cos(j * step + angle) * radius * ratio;
    var y = Math.sin(j * step + angle) * radius * ratio;
    context.beginPath();
    context.arc(x, y, point_radius , 0, 2 * Math.PI, true);
    context.closePath();
    context.stroke();
  },
  clearHit : function (options) {
    var step = 2 * Math.PI / options.data.length;
    var angle   = -Math.PI / 2;
    var radius  = Math.min(options.height, options.width) * options.radiusRatio / 2;

    var context = options.context;

    var
        s = options.args.series,
        lw = (s.points ? s.points.lineWidth : 1);
        offset = (s.points.hitRadius || s.points.radius || s.mouse.radius) + lw;

    context.translate(options.width / 2, options.height / 2);

    var j = options.args.index;
    var ratio = options.data[j][1] / this.max;
    var x = Math.cos(j * step + angle) * radius * ratio;
    var y = Math.sin(j * step + angle) * radius * ratio;
    context.clearRect(x-offset,y-offset,offset*2,offset*2);
  },
  extendYRange : function (axis, data) {
    this.max = Math.max(axis.max, this.max || -Number.MAX_VALUE);
  }
});
