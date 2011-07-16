/** Pie **/
/**
 * Formats the pies labels.
 * @param {Object} slice - Slice object
 * @return {String} Formatted pie label string
 */
Flotr.defaultPieLabelFormatter = function(slice) {
  return (slice.fraction*100).toFixed(2)+'%';
};

Flotr.addType('pie', {
  options: {
    show: false,           // => setting to true will show bars, false will hide
    lineWidth: 1,          // => in pixels
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.6,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    explode: 6,            // => the number of pixels the splices will be far from the center
    sizeRatio: 0.6,        // => the size ratio of the pie relative to the plot 
    startAngle: Math.PI/4, // => the first slice start angle
    labelFormatter: Flotr.defaultPieLabelFormatter,
    pie3D: false,          // => whether to draw the pie in 3 dimenstions or not (ineffective) 
    pie3DviewAngle: (Math.PI/2 * 0.8),
    pie3DspliceThickness: 20
  },
  /**
   * Draws a pie in the canvas element.
   * @param {Object} series - Series with options.pie.show = true.
   */
  draw: function(series) {
    if (this.options.pie.drawn) return;
    var ctx = this.ctx,
        options = this.options,
        lw = series.pie.lineWidth,
        sw = series.shadowSize,
        data = series.data,
        plotOffset = this.plotOffset,
        radius = (Math.min(this.canvasWidth, this.canvasHeight) * series.pie.sizeRatio) / 2,
        html = [],
      vScale = 1,//Math.cos(series.pie.viewAngle);
      plotTickness = Math.sin(series.pie.viewAngle)*series.pie.spliceThickness / vScale,
    
    style = {
      size: options.fontSize*1.2,
      color: options.grid.color,
      weight: 1.5
    },
    
    center = {
      x: plotOffset.left + (this.plotWidth)/2,
      y: plotOffset.top + (this.plotHeight)/2
    },
    
    portions = this.pie._getPortions(),
    slices = this.pie._getSlices(portions, series);

    ctx.save();
    
    if(sw > 0){
      _.each(slices, function (slice) {
        if (slice.startAngle == slice.endAngle) return;
        
        var bisection = (slice.startAngle + slice.endAngle) / 2,
            xOffset = center.x + Math.cos(bisection) * slice.options.explode + sw,
            yOffset = center.y + Math.sin(bisection) * slice.options.explode + sw;
        
        this.pie.plotSlice(xOffset, yOffset, radius, slice.startAngle, slice.endAngle, false, vScale);
        
        if (series.pie.fill) {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fill();
        }
      }, this);
    }
    
    if (options.HtmlText || !this.textEnabled)
      html = [];
    
    _.each(slices, function (slice, index) {
      if (slice.startAngle == slice.endAngle) return;
      
      var bisection = (slice.startAngle + slice.endAngle) / 2,
          color = slice.series.color,
          fillColor = slice.options.fillColor || color,
          xOffset = center.x + Math.cos(bisection) * slice.options.explode,
          yOffset = center.y + Math.sin(bisection) * slice.options.explode;
      
      this.pie.plotSlice(xOffset, yOffset, radius, slice.startAngle, slice.endAngle, false, vScale);
      
      if(series.pie.fill){
        ctx.fillStyle = this.processColor(fillColor, {opacity: series.pie.fillOpacity});
        ctx.fill();
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = color;
      ctx.stroke();
      
      var label = options.pie.labelFormatter(slice),
          textAlignRight = (Math.cos(bisection) < 0),
          textAlignTop = (Math.sin(bisection) > 0),
          explodeCoeff = (slice.options.explode || series.pie.explode) + radius + 4,
          distX = center.x + Math.cos(bisection) * explodeCoeff,
          distY = center.y + Math.sin(bisection) * explodeCoeff;
      
      if (slice.fraction && label) {
        if (options.HtmlText || !this.textEnabled) {
          var yAlignDist = textAlignTop ? (distY - 5) : (this.plotHeight - distY + 5),
              divStyle = 'position:absolute;' + (textAlignTop ? 'top' : 'bottom') + ':' + yAlignDist + 'px;'; //@todo: change
          if (textAlignRight)
            divStyle += 'right:'+(this.canvasWidth - distX)+'px;text-align:right;';
          else 
            divStyle += 'left:'+distX+'px;text-align:left;';
          html.push('<div style="', divStyle, '" class="flotr-grid-label">', label, '</div>');
        }
        else {
          style.textAlign = textAlignRight ? 'right' : 'left';
          style.textBaseline = textAlignTop ? 'top' : 'bottom';
          Flotr.drawText(ctx, label, distX, distY, style);
        }
      }
    }, this);
    
    if (options.HtmlText || !this.textEnabled) {
      var div = Flotr.DOM.node('<div style="color:' + this.options.grid.color + '" class="flotr-labels"></div>');
      Flotr.DOM.insert(div, html.join(''));
      Flotr.DOM.insert(this.el, div);
    }
    
    ctx.restore();
    options.pie.drawn = true;
  },
  plotSlice: function(x, y, radius, startAngle, endAngle, fill, vScale) {
    var ctx = this.ctx;
    vScale = vScale || 1;

    ctx.scale(1, vScale);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc   (x, y, radius, startAngle, endAngle, fill);
    ctx.lineTo(x, y);
    ctx.closePath();
  },
  hit: function(mouse, n){

    var series = this.series,
      options = this.options,
      radius = (Math.min(this.canvasWidth, this.canvasHeight) * options.pie.sizeRatio) / 2,
      vScale = 1,//Math.cos(series.pie.viewAngle),
      angle = options.pie.startAngle,
      center, // Center of the pie
      s, x, y;

    center = {
      x: (this.plotWidth)/2,
      y: (this.plotHeight)/2
    };

    portions = this.pie._getPortions();
    slices = this.pie._getSlices(portions, series, angle);

    for (i = 0; i < series.length; i++){

      s = series[i];
      x = s.data[0][0];
      y = s.data[0][1];

      if (y === null) continue;
      
      var a = (mouse.relX-center.x),
        b = (mouse.relY-center.y),
        c = Math.sqrt(Math.pow(a, 2)+Math.pow(b, 2)),
        sAngle = (slices[i].startAngle)%(2 * Math.PI),
        eAngle = (slices[i].endAngle)%(2 * Math.PI),
        sAngle = (sAngle> 0 )? sAngle : sAngle + (2 * Math.PI),
        eAngle = (eAngle> 0 )? eAngle : eAngle + (2 * Math.PI),
        xSin = b/c,
        kat = Math.asin(xSin)%(2 * Math.PI),
        kat = (kat>0) ? kat : kat + (2 * Math.PI),
        kat2 = Math.asin(-xSin)+(Math.PI);
      
      //if (c<radius && (a>0 && sAngle < kat && eAngle > kat)) //I i IV quarter
      //if (c<radius && (a<0 && sAngle < kat2 && eAngle > kat2)) //II i III quarter
      //if(sAngle>aAngle && ((a>0 && (sAngle < kat || eAngle > kat)) || (a<0 && (sAngle < kat2 || eAngle > kat2)))) //if a slice is crossing 0 angle
      
      if (c<radius+10 && ((((a>0 && sAngle < kat && eAngle > kat)) || (a<0 && sAngle < kat2 && eAngle > kat2)) || 
          ( (sAngle>eAngle || slices[i].fraction==1) && ((a>0 && (sAngle < kat || eAngle > kat)) || (a<0 && (sAngle < kat2 || eAngle > kat2))))))
      { 
        n.x = x;
        n.y = y;
        n.sAngle = sAngle;
        n.eAngle = eAngle,
        n.mouse = s.mouse;
        n.series = s;
        n.allSeries = series;
        n.seriesIndex = i;
        n.fraction = slices[i].fraction;
      }
    }
  },
  drawHit: function(n){
    var octx = this.octx,
      s = n.series,
      xa = n.xaxis,
      ya = n.yaxis;
  	
    octx.save();
    octx.translate(this.plotOffset.left, this.plotOffset.top);
    octx.beginPath();

    if (s.mouse.trackAll) {
      octx.moveTo(xa.d2p(n.x), ya.d2p(0));
      octx.lineTo(xa.d2p(n.x), ya.d2p(n.yaxis.max));
    }
    else {
      var center = {
        x: (this.plotWidth)/2,
        y: (this.plotHeight)/2
      },
      radius = (Math.min(this.canvasWidth, this.canvasHeight) * s.pie.sizeRatio) / 2,

      bisection = n.sAngle<n.eAngle ? (n.sAngle + n.eAngle) / 2 : (n.sAngle + n.eAngle + 2* Math.PI) / 2,
      xOffset = center.x + Math.cos(bisection) * n.series.pie.explode,
      yOffset = center.y + Math.sin(bisection) * n.series.pie.explode;
      
      octx.beginPath();
      octx.moveTo(xOffset, yOffset);
      if (n.fraction != 1)
        octx.arc(xOffset, yOffset, radius, n.sAngle, n.eAngle, false);
      else
        octx.arc(xOffset, yOffset, radius, n.sAngle, n.eAngle-0.00001, false);
      octx.lineTo(xOffset, yOffset);
      octx.closePath();
    }

    octx.stroke();
    octx.closePath();
    octx.restore();
  },
  clearHit: function(){
    var center = {
      x: this.plotOffset.left + (this.plotWidth)/2,
      y: this.plotOffset.top + (this.plotHeight)/2
    },
    pie = this.prevHit.series.pie,
    radius = (Math.min(this.canvasWidth, this.canvasHeight) * pie.sizeRatio) / 2,
    margin = (pie.explode + pie.lineWidth) * 4;
      
    this.octx.clearRect(
      center.x - radius - margin, 
      center.y - radius - margin, 
      2*(radius + margin), 
      2*(radius + margin)
    );
  },
  _getPortions: function(){
    return _.map(this.series, function(hash, index){
      if (hash.pie.show && hash.data[0][1] !== null)
        return {
          name: (hash.label || hash.data[0][1]),
          value: [index, hash.data[0][1]],
          options: hash.pie,
          series: hash
        };
    });
  },
  _getSum: function(portions){
    // Sum of the portions' angles
    return _.inject(_.pluck(_.pluck(portions, 'value'), 1), function(acc, n) { return acc + n; }, 0);
  },
  _getSlices: function(portions, series, startAngle){
    var sum = this.pie._getSum(portions),
      fraction = 0.0,
      angle = (!_.isUndefined(startAngle) ? startAngle : series.pie.startAngle),
      value = 0.0;
    return _.map(portions, function(slice){
      angle += fraction;
      value = parseFloat(slice.value[1]); // @warning : won't support null values !!
      fraction = value/sum;
      return {
        name:     slice.name,
        fraction: fraction,
        x:        slice.value[0],
        y:        value,
        value:    value,
        options:  slice.options,
        series:   slice.series,
        startAngle: 2 * angle * Math.PI,
        endAngle:   2 * (angle + fraction) * Math.PI
      };
    });
  }
});
