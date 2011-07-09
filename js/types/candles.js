/** Candles **/
Flotr.addType('candles', {
  options: {
    show: false,           // => setting to true will show candle sticks, false will hide
    lineWidth: 1,          // => in pixels
    wickLineWidth: 1,      // => in pixels
    candleWidth: 0.6,      // => in units of the x axis
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    upFillColor: '#00A8F0',// => up sticks fill color
    downFillColor: '#CB4B4B',// => down sticks fill color
    fillOpacity: 0.5,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    barcharts: false       // => draw as barcharts (not standard bars but financial barcharts)
  },
  /**
   * Draws candles series in the canvas element.
   * @param {Object} series - Series with options.candles.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
        bw = series.candles.candleWidth;
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'miter';

    /**
     * @todo linewidth not interpreted the right way.
     */
    ctx.lineWidth = series.candles.lineWidth;
    this.candles.plotShadows(series, bw/2);
    this.candles.plot(series, bw/2);
    
    ctx.restore();
  },
  plot: function(series, offset){
    var data = series.data;
    if(data.length < 1) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx;

    for(var i = 0; i < data.length; i++){
      var d     = data[i],
          x     = d[0],
          open  = d[1],
          high  = d[2],
          low   = d[3],
          close = d[4];

      var left    = x - series.candles.candleWidth/2,
          right   = x + series.candles.candleWidth/2,
          bottom  = Math.max(ya.min, low),
          top     = Math.min(ya.max, high),
          bottom2 = Math.max(ya.min, Math.min(open, close)),
          top2    = Math.min(ya.max, Math.max(open, close));

      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;

      var color = series.candles[open>close?'downFillColor':'upFillColor'];
      /**
       * Fill the candle.
       */
      if(series.candles.fill && !series.candles.barcharts){
        ctx.fillStyle = this.processColor(color, {opacity: series.candles.fillOpacity});
        ctx.fillRect(xa.d2p(left), ya.d2p(top2) + offset, xa.d2p(right) - xa.d2p(left), ya.d2p(bottom2) - ya.d2p(top2));
      }

      /**
       * Draw candle outline/border, high, low.
       */
      if(series.candles.lineWidth || series.candles.wickLineWidth){
        var x, y, pixelOffset = (series.candles.wickLineWidth % 2) / 2;

        x = Math.floor(xa.d2p((left + right) / 2)) + pixelOffset;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = series.candles.wickLineWidth;
        ctx.lineCap = 'butt';
        
        if (series.candles.barcharts) {
          ctx.beginPath();
          
          ctx.moveTo(x, Math.floor(ya.d2p(top) + offset));
          ctx.lineTo(x, Math.floor(ya.d2p(bottom) + offset));
          
          y = Math.floor(ya.d2p(open) + offset)+0.5;
          ctx.moveTo(Math.floor(xa.d2p(left))+pixelOffset, y);
          ctx.lineTo(x, y);
          
          y = Math.floor(ya.d2p(close) + offset)+0.5;
          ctx.moveTo(Math.floor(xa.d2p(right))+pixelOffset, y);
          ctx.lineTo(x, y);
        } 
        else {
          ctx.strokeRect(xa.d2p(left), ya.d2p(top2) + offset, xa.d2p(right) - xa.d2p(left), ya.d2p(bottom2) - ya.d2p(top2));
          
          ctx.beginPath();
          ctx.moveTo(x, Math.floor(ya.d2p(top2   ) + offset));
          ctx.lineTo(x, Math.floor(ya.d2p(top    ) + offset));
          ctx.moveTo(x, Math.floor(ya.d2p(bottom2) + offset));
          ctx.lineTo(x, Math.floor(ya.d2p(bottom ) + offset));
        }
        
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }
  },
  plotShadows: function(series, offset){
    var data = series.data;
    if(data.length < 1 || series.candles.barcharts) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        sw = this.options.shadowSize;
    
    for(var i = 0; i < data.length; i++){
      var d     = data[i],
          x     = d[0],
          open  = d[1],
          high  = d[2],
          low   = d[3],
          close = d[4];
      
      var left   = x - series.candles.candleWidth/2,
          right  = x + series.candles.candleWidth/2,
          bottom = Math.max(ya.min, Math.min(open, close)),
          top    = Math.min(ya.max, Math.max(open, close));
      
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;
      
      var width =  xa.d2p(right)-xa.d2p(left)-((xa.d2p(right)+sw <= this.plotWidth) ? 0 : sw);
      var height = Math.max(0, ya.d2p(bottom)-ya.d2p(top)-((ya.d2p(bottom)+sw <= this.plotHeight) ? 0 : sw));
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
      this.ctx.fillRect(Math.min(xa.d2p(left)+sw, this.plotWidth), Math.min(ya.d2p(top)+sw, this.plotWidth), width, height);
    }
  },
  extendXRange: function(axis){
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, c;

      for(i = 0; i < this.series.length; ++i){
        c = this.series[i].candles;
        if(c.show && this.series[i].xaxis == axis) {
          // We don't use c.candleWidth in order not to stick the borders
          newmax = Math.max(axis.datamax + 0.5, newmax);
          newmin = Math.min(axis.datamin - 0.5, newmin);
        }
      }
      axis.max = newmax;
      axis.min = newmin;
    }
  }
});
