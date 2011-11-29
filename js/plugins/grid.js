(function () {

var E = Flotr.EventAdapter,
    _ = Flotr._;

Flotr.addPlugin('graphGrid', {

  callbacks: {
    'flotr:beforedraw' : function () {
      this.graphGrid.drawGrid();
    },
    'flotr:afterdraw' : function () {
      this.graphGrid.drawOutline();
    }
  },

  drawGrid: function(){

    var
      ctx = this.ctx,
      options = this.options,
      grid = options.grid,
      verticalLines = grid.verticalLines,
      horizontalLines = grid.horizontalLines,
      minorVerticalLines = grid.minorVerticalLines,
      minorHorizontalLines = grid.minorHorizontalLines,
      a, v;
        
    if(verticalLines || minorVerticalLines || 
           horizontalLines || minorHorizontalLines){
      E.fire(this.el, 'flotr:beforegrid', [this.axes.x, this.axes.y, options, this]);
    }
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = grid.tickColor;
    
    if (grid.circular) {
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = Math.min(this.plotHeight, this.plotWidth)*options.radar.radiusRatio/2,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      // Draw grid lines in vertical direction.
      ctx.beginPath();
      
      if(horizontalLines){
        a = this.axes.y;
        for(var i = 0; i < a.ticks.length; ++i){
          v = a.ticks[i].v;
          var ratio = v / a.max;
          
          for(var j = 0; j <= sides; ++j){
            ctx[j == 0 ? 'moveTo' : 'lineTo'](Math.cos(j*coeff+angle)*radius*ratio, Math.sin(j*coeff+angle)*radius*ratio);
          }
          //ctx.moveTo(radius*ratio, 0);
          //ctx.arc(0, 0, radius*ratio, 0, Math.PI*2, true);
        }
      }
      if(minorHorizontalLines){
        a = this.axes.y;
        _.each(_.pluck(a.minorTicks, 'v'), function(v){
          var ratio = v / a.max;
      
          for(var j = 0; j <= sides; ++j){
            ctx[j == 0 ? 'moveTo' : 'lineTo'](Math.cos(j*coeff+angle)*radius*ratio, Math.sin(j*coeff+angle)*radius*ratio);
          }
          //ctx.moveTo(radius*ratio, 0);
          //ctx.arc(0, 0, radius*ratio, 0, Math.PI*2, true);
        });
      }
      
      if(verticalLines){
        _.times(sides, function(i){
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(i*coeff+angle)*radius, Math.sin(i*coeff+angle)*radius);
        });
      }
      ctx.stroke();
    }
    else {
      ctx.translate(this.plotOffset.left, this.plotOffset.top);
  
      // Draw grid background, if present in options.
      if(grid.backgroundColor != null){
        ctx.fillStyle = this.processColor(grid.backgroundColor, {x1: 0, y1: 0, x2: this.plotWidth, y2: this.plotHeight});
        ctx.fillRect(0, 0, this.plotWidth, this.plotHeight);
      }
      
      // Draw grid lines in vertical direction.
      ctx.beginPath();
      
      if(verticalLines){
        a = this.axes.x;
        _.each(_.pluck(a.ticks, 'v'), function(v){
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && grid.outlineWidth != 0)
            return;
    
          ctx.moveTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, 0);
          ctx.lineTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, this.plotHeight);
        }, this);
      }
      if(minorVerticalLines){
        a = this.axes.x;
         _.each(_.pluck(a.minorTicks, 'v'), function(v){
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && grid.outlineWidth != 0)
            return;
      
          ctx.moveTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, 0);
          ctx.lineTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, this.plotHeight);
        }, this);
      }
      
      // Draw grid lines in horizontal direction.
      if(horizontalLines){
        a = this.axes.y;
        _.each(_.pluck(a.ticks, 'v'), function(v){
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && grid.outlineWidth != 0)
            return;
    
          ctx.moveTo(0, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
          ctx.lineTo(this.plotWidth, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
        }, this);
      }
      if(minorHorizontalLines){
        a = this.axes.y;
        _.each(_.pluck(a.ticks, 'v'), function(v){
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && grid.outlineWidth != 0)
            return;
    
          ctx.moveTo(0, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
          ctx.lineTo(this.plotWidth, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
        }, this);
      }
      ctx.stroke();
    }
    
    ctx.restore();
    if(verticalLines || minorVerticalLines ||
       horizontalLines || minorHorizontalLines){
      E.fire(this.el, 'flotr:aftergrid', [this.axes.x, this.axes.y, options, this]);
    }
  }, 

  drawOutline: function(){
    var
      options = this.options,
      grid = options.grid,
      ctx = this.ctx,
      v;
    
    if (grid.outlineWidth == 0) return;
    
    ctx.save();
    
    if (grid.circular) {
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = Math.min(this.plotHeight, this.plotWidth)*options.radar.radiusRatio/2,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      // Draw axis/grid border.
      ctx.beginPath();
      ctx.lineWidth = grid.outlineWidth;
      ctx.strokeStyle = grid.color;
      ctx.lineJoin = 'round';
      
      for(var i = 0; i <= sides; ++i){
        ctx[i == 0 ? 'moveTo' : 'lineTo'](Math.cos(i*coeff+angle)*radius, Math.sin(i*coeff+angle)*radius);
      }
      //ctx.arc(0, 0, radius, 0, Math.PI*2, true);

      ctx.stroke();
    }
    else {
      ctx.translate(this.plotOffset.left, this.plotOffset.top);
      
      // Draw axis/grid border.
      var lw = grid.outlineWidth,
          orig = 0.5-lw+((lw+1)%2/2);
      ctx.lineWidth = lw;
      ctx.strokeStyle = grid.color;
      ctx.lineJoin = 'miter';
      ctx.strokeRect(orig, orig, this.plotWidth, this.plotHeight);
    }
    
    ctx.restore();

    var
      backgroundImage = grid.backgroundImage,
      that = this,
      plotOffset = this.plotOffset,
      width = this.plotWidth,
      height = this.plotHeight,
      img, src, left, top, globalAlpha;


    if (backgroundImage) {

      src = backgroundImage.src || backgroundImage;
      left = (parseInt(backgroundImage.left, 10) || 0) + plotOffset.left;
      top = (parseInt(backgroundImage.top, 10) || 0) + plotOffset.top;
      img = new Image();

      img.onload = function() {
        ctx.save();
        if (backgroundImage.alpha) ctx.globalAlpha = backgroundImage.alpha;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(img, 0, 0, width, height, left, top, width, height);
        ctx.restore();
      };

      img.src = src;
    }
  }
});

})();
