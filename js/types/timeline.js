Flotr.addType('timeline', {
  options: {
    show: false,
    lineWidth: 1,
    barWidth: .2,
    fill: true,
    fillColor: null,
    fillOpacity: 0.4,
    centered: true
  },

  draw : function (series) {

    var
      ctx       = this.ctx,
      barWidth  = series.timeline.barWidth,
      lineWidth = series.timeline.lineWidth,
      color     = series.color,
      fillColor = series.timeline.fillColor || color,
      opacity   = series.timeline.fillOpacity;

    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin    = 'miter';
    ctx.lineWidth   = lineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle   = this.processColor(fillColor, {opacity: opacity});

    this.timeline.plot(series, barWidth, lineWidth);

    ctx.restore();
  },

  plot : function (series, barWidth, lineWidth) {

    var
      data  = series.data,
      xa    = series.xaxis,
      ya    = series.yaxis,
      ctx   = this.ctx,
      i;

    Flotr._.each(data, function (timeline) {

      var 
        x   = timeline[0],
        y   = timeline[1],
        w   = timeline[2],
        h   = barWidth,

        xt  = Math.ceil(xa.d2p(x)),
        wt  = Math.ceil(xa.d2p(x + w)) - xt,
        yt  = Math.round(ya.d2p(y)),
        ht  = Math.round(ya.d2p(y - h)) - yt,

        x0  = xt - lineWidth / 2,
        y0  = Math.round(yt - ht / 2) - lineWidth / 2;

      ctx.strokeRect(x0, y0, wt, ht);
      ctx.fillRect(x0, y0, wt, ht);

    }, this);
  },

  extendRange : function (series) {

    var
      data  = series.data,
      xa    = series.xaxis,
      ya    = series.yaxis,
      w     = series.timeline.barWidth;

    if (xa.options.min == null)
      xa.min = xa.datamin - w / 2;

    if (xa.options.max == null) {

      var
        max = xa.max;

      Flotr._.each(data, function (timeline) {
        max = Math.max(max, timeline[0] + timeline[2]);
      }, this);

      xa.max = max + w / 2;
    }

    if (ya.options.min == null)
      ya.min = ya.datamin - w;
    if (ya.options.min == null)
      ya.max = ya.datamax + w;
  }

});
