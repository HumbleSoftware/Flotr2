/** Lines **/
Flotr.addType('lines', {
  options: {
    show: false,           // => setting to true will show lines, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: false,           // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    stacked: false         // => setting to true will show stacked lines, false will show normal lines
  },
  /**
   * Draws lines series in the canvas element.
   * @param {Object} series - Series with options.lines.show = true.
   */
  draw: function(series){

    var ctx = this.ctx,
      lineWidth = series.lines.lineWidth,
      shadowSize = series.shadowSize,
      offset;

    series = series || this.series;

    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'round';
    this.lines.clip();

    if(shadowSize){

      ctx.lineWidth = shadowSize / 2;
      offset = lineWidth/2 + ctx.lineWidth/2;
      
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      this.lines.plot(series, offset + shadowSize/2, false);

      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      this.lines.plot(series, offset, false);

      if(series.lines.fill) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        this.lines.plotArea(series, offset + shadowSize/2, false);
      }
    }

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = series.color;
    if(series.lines.fill){
      ctx.fillStyle = this.processColor(series.lines.fillColor || series.color, {opacity: series.lines.fillOpacity});
      this.lines.plotArea(series, 0, true);
    }

    this.lines.plot(series, 0, true);
    ctx.restore();
  },

  plot: function(series, offset, incStack){

    var ctx = this.ctx,
      xa = series.xaxis,
      ya = series.yaxis,
      data = series.data, 
      length = data.length - 1,
      width = this.plotWidth, 
      height = this.plotHeight,
      prevx = null,
      prevy = null,
      x1, x2, y1, y2, stack1, stack2, i;
      
    if(length < 2) return;

    ctx.beginPath();

    for(i = 0; i < length; ++i){

      // To allow empty values
      if (data[i][1] === null || data[i+1][1] === null) continue;

      // Zero is infinity for log scales
      if (xa.options.scaling === 'logarithmic' && (data[i][0] <= 0 || data[i+1][0] <= 0)) continue;
      if (ya.options.scaling === 'logarithmic' && (data[i][1] <= 0 || data[i+1][1] <= 0)) continue;
      
      x1 = xa.d2p(data[i][0]);
      x2 = xa.d2p(data[i+1][0]);
      
      if (series.lines.stacked) {

        stack1 = xa.values[data[i][0]].stack || 0;
        stack2 = xa.values[data[i+1][0]].stack || xa.values[data[i][0]].stack || 0;

        y1 = ya.d2p(data[i][1] + stack1);
        y2 = ya.d2p(data[i+1][1] + stack2);
        
        if(incStack){
          xa.values[data[i][0]].stack = data[i][1]+stack1;
            
          if(i == length-1)
            xa.values[data[i+1][0]].stack = data[i+1][1]+stack2;
        }
      }
      else{
        y1 = ya.d2p(data[i][1]);
        y2 = ya.d2p(data[i+1][1]);
      }

      if ((y1 >= height && y2 >= width) || 
        (y1 <= 0 && y2 <= 0) ||
        (x1 <= 0 && x2 <= 0) ||
        (x1 >= width && x2 >= width)) continue;

      if((prevx != x1) || (prevy != y1 + offset))
        ctx.moveTo(x1, y1 + offset);
      
      prevx = x2;
      prevy = y2 + offset;
      ctx.lineTo(prevx, prevy);
    }
    
    ctx.stroke();
    ctx.closePath();
  },

  clip : function () {
    var ctx = this.ctx;
    ctx.beginPath();
    ctx.rect(0, 0, this.plotWidth, this.plotHeight);
    ctx.clip();
  },

  /**
   * Function used to fill
   * @param {Object} series - The series to draw
   * @param {Object} offset
   */
  plotArea: function(series, offset, saveStrokePath){

    var ctx = this.ctx,
      xa = series.xaxis,
      ya = series.yaxis,
      data = series.data,
      length = data.length - 1,
      bottom = Math.min(Math.max(0, ya.min), ya.max),
      lastX = 0,
      first = true,
      strokePath = [],
      pathIdx = 0,
      stack1 = 0,
      stack2 = 0,
      top, x1, x2, y1, y2, i,
      x1old, x2old,
      x1PointValue,
      x2PointValue,
      yaMaxPointValue,
      yaMinPointValue,
      path;

    function addStrokePath(xVal, yVal) {
      if (saveStrokePath) {
        strokePath[pathIdx] = [];
        strokePath[pathIdx][0] = xVal;
        strokePath[pathIdx][1] = yVal;
        pathIdx++;
      }
    }
      
    if(data.length < 2) return;
    
    ctx.beginPath();
    
    for(i = 0; i < length; ++i){
      x1 = data[i][0];
      x2 = data[i+1][0];
      
      if (series.lines.stacked) {

        stack1 = xa.values[data[i][0]].stack || 0;
        stack2 = xa.values[data[i+1][0]].stack || xa.values[data[i][0]].stack || 0;
        
        y1 = data[i][1] + stack1;
        y2 = data[i+1][1] + stack2;
      }
      else{
        y1 = data[i][1];
        y2 = data[i+1][1];
      }
      
      if(x1 <= x2 && x1 < xa.min){
        if(x2 < xa.min) continue;
        y1 = (xa.min - x1) / (x2 - x1) * (y2 - y1) + y1;
        x1 = xa.min;
      }
      else if(x2 <= x1 && x2 < xa.min){
        if(x1 < xa.min) continue;
        y2 = (xa.min - x1) / (x2 - x1) * (y2 - y1) + y1;
        x2 = xa.min;
      }
                
      if(x1 >= x2 && x1 > xa.max){
        if(x2 > xa.max) continue;
        y1 = (xa.max - x1) / (x2 - x1) * (y2 - y1) + y1;
        x1 = xa.max;
      }
      else if(x2 >= x1 && x2 > xa.max){
        if (x1 > xa.max) continue;
        y2 = (xa.max - x1) / (x2 - x1) * (y2 - y1) + y1;
        x2 = xa.max;
      }

      if(first){
        ctx.moveTo(x1PointValue, ya.d2p(bottom + stack1) + offset);
        addStrokePath(x1PointValue, ya.d2p(bottom + stack1) + offset);
        first = false;
      }
      lastX = Math.max(x2, lastX);
      
      // Now check the case where both is outside.
      if(y1 >= ya.max && y2 >= ya.max){
        ctx.lineTo(x1PointValue, yaMaxPointValue + offset);
        ctx.lineTo(x2PointValue, yaMaxPointValue + offset);
        addStrokePath(x1PointValue, yaMaxPointValue + offset);
        addStrokePath(x2PointValue, yaMaxPointValue + offset);
        continue;
      }
      else if(y1 <= ya.min && y2 <= ya.min){
        ctx.lineTo(x1PointValue, yaMinPointValue + offset);
        ctx.lineTo(x2PointValue, yaMinPointValue + offset);
        addStrokePath(x1PointValue, yaMinPointValue + offset);
        addStrokePath(x2PointValue, yaMinPointValue + offset);
        continue;
      }
      
      /**
       * Else it's a bit more complicated, there might
       * be two rectangles and two triangles we need to fill
       * in; to find these keep track of the current x values.
       */
      x1old = x1;
      x2old = x2;
      
      x1NewPointValue = xa.d2p(x1); // Cache d2p values
      x2NewPointValue = xa.d2p(x2);
      y1PointValue = ya.d2p(y1);
      y2PointValue = ya.d2p(y2);
      
      // If the x value was changed we got a rectangle to fill.
      if(x1 != x1old){
        top = (y1 <= ya.min) ? yaMinPointValue : yaMaxPointValue;
        ctx.lineTo(x1PointValue, top + offset);
        ctx.lineTo(x1NewPointValue, top + offset);
        addStrokePath(x1PointValue, top + offset);
        addStrokePath(x1NewPointValue, top + offset);
      }
         
      // Fill the triangles.
      ctx.lineTo(x1NewPointValue, y1PointValue + offset);
      ctx.lineTo(x2NewPointValue, y2PointValue + offset);
      addStrokePath(x1NewPointValue, y1PointValue + offset);
      addStrokePath(x2NewPointValue, y2PointValue + offset);

      // Fill the other rectangle if it's there.
      if(x2 != x2old){
        top = (y2 <= ya.min) ? yaMinPointValue : yaMaxPointValue;
        ctx.lineTo(x2PointValue, top + offset);
        addStrokePath(x2PointValue, top + offset);
      }

      lastX = Math.max(x2, x2old, lastX);
    }
    
    ctx.lineTo(xa.d2p(lastX), ya.d2p(bottom) + offset);
    addStrokePath(xa.d2p(lastX), ya.d2p(bottom) + offset);
    
    // go back along previous stroke path
    path = xa.lastStrokePath;
    
    if (series.lines.stacked) {
      if (path) {
        for(i = path.length-1; i >= 0; --i){
          ctx.lineTo(path[i][0], path[i][1] - offset/2);
        }
      }
      // add stroke path to series data
      if (saveStrokePath) {
        xa.lastStrokePath = strokePath;
      }
    }
    
    ctx.closePath();
    ctx.fill();
  },

  extendYRange: function(axis){
    var o = axis.options;
    if((!o.max && o.max !== 0) || (!o.min && o.min !== 0)){
      var newmax = axis.max,
          newmin = axis.min,
          x, i, j, s, l,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;
                  
      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        l = s.lines;
        if (l.show && !s.hide && s.yaxis == axis) {
          // For stacked lines
          if(l.stacked){
            for (j = 0; j < s.data.length; j++) {
              x = s.data[j][0]+'';
              if(s.data[j][1]>0)
                stackedSumsPos[x] = (stackedSumsPos[x] || 0) + s.data[j][1];
              else
                stackedSumsNeg[x] = (stackedSumsNeg[x] || 0) + s.data[j][1];
              lastSerie = s;
            }
            
            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
            for (j in stackedSumsNeg) {
              newmin = Math.min(stackedSumsNeg[j], newmin);
            }
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  }
});
