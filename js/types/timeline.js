Flotr.addType('timeline', {
  options: {
    show: false,
    lineWidth: 1,
    barWidth: 0.2,
    fill: true,
    fillColor: null,
    fillOpacity: 0.4,
    centered: true
  },

  draw : function (options) {

    var
      context = options.context;

    context.save();
    context.lineJoin    = 'miter';
    context.lineWidth   = options.lineWidth;
    context.strokeStyle = options.color;
    context.fillStyle   = options.fillStyle;

    this.plot(options);

    context.restore();
  },

  plot : function (options) {

    var
      data      = options.data,
      context   = options.context,
      xScale    = options.xScale,
      yScale    = options.yScale,
      barWidth  = options.barWidth,
      lineWidth = options.lineWidth,
      i;

    Flotr._.each(data, function (timeline) {

      var
        x   = timeline[0],
        y   = timeline[1],
        w   = timeline[2],
        h   = barWidth,

        xt  = Math.ceil(xScale(x)),
        wt  = Math.ceil(xScale(x + w)) - xt,
        yt  = Math.round(yScale(y)),
        ht  = Math.round(yScale(y - h)) - yt,

        x0  = xt - lineWidth / 2,
        y0  = Math.round(yt - ht / 2) - lineWidth / 2;

      context.strokeRect(x0, y0, wt, ht);
      context.fillRect(x0, y0, wt, ht);

    });
  },

  hit : function (options) {
      var
        data   = options.data,
        args   = options.args,
        n      = args[1],
        mouse  = args[0],
        x      = options.xInverse(mouse.relX),
        y      = options.yInverse(mouse.relY),
        h      = options.barWidth,
        x0, x1, y0, y1, i;

      for (i = data.length; i--;) {
        w = data[i][2];
        x0 = data[i][0];
        x1 = x0 + w;

	y0 = data[i][1] + h;
	y1 = data[i][1] - h;

	if ((x >= x0) && (x <= x1) && (y <= y0) && (y >= y1)) {
            n.x = x0;
            n.y = y0 - h;
            n.index = i;
            n.seriesIndex = options.index;
        }
      }
  },

  drawHit : function(options) {
  },

  clearHit : function(options) {
  },

  extendRange : function (series) {

    var
      data  = series.data,
      xa    = series.xaxis,
      ya    = series.yaxis,
      w     = series.timeline.barWidth;

    if (xa.options.min === null)
      xa.min = xa.datamin - w / 2;

    if (xa.options.max === null) {

      var
        max = xa.max;

      Flotr._.each(data, function (timeline) {
        max = Math.max(max, timeline[0] + timeline[2]);
      }, this);

      xa.max = max + w / 2;
    }

    if (ya.options.min === null)
      ya.min = ya.datamin - w;
    if (ya.options.min === null)
      ya.max = ya.datamax + w;
  }

});
