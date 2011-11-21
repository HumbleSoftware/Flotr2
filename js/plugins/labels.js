(function () {

var D = Flotr.DOM;

Flotr.addPlugin('labels', {

  callbacks : {
    'flotr:afterdraw' : function () {
      this.labels.draw();
    }
  },

  draw: function(){
    // Construct fixed width label boxes, which can be styled easily. 
    var noLabels = 0, axis,
        xBoxWidth, i, html, tick, left, top,
        options = this.options,
        ctx = this.ctx,
        a = this.axes,
        style;
    
    for(i = 0; i < a.x.ticks.length; ++i){
      if (a.x.ticks[i].label) {
        ++noLabels;
      }
    }
    xBoxWidth = this.plotWidth / noLabels;
    
    if (options.grid.circular) {
      ctx.save();
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = this.plotHeight*options.radar.radiusRatio/2 + options.fontSize,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2,
          x, y;
      
      style = {
        size: options.fontSize
      };

      // Add x labels.
      drawLabelCircular(this, a.x, false);
      drawLabelCircular(this, a.x, true);
      drawLabelCircular(this, a.y, false);
      drawLabelCircular(this, a.y, true);
      ctx.restore();
    } 
    if (!options.HtmlText && this.textEnabled) {
      style = {
        size: options.fontSize
      };
      drawLabelNoHtmlText(this, a.x, 'center', 'top');
      drawLabelNoHtmlText(this, a.x2, 'center', 'bottom');
      drawLabelNoHtmlText(this, a.y, 'right', 'middle');
      drawLabelNoHtmlText(this, a.y2, 'left', 'middle');
    }
    else if (a.x.options.showLabels || a.x2.options.showLabels || a.y.options.showLabels || a.y2.options.showLabels) {
      html = [];
      
      // Add x labels.
      axis = a.x;
      if (axis.options.showLabels){
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if(!tick.label || tick.label.length == 0 || 
              (this.plotOffset.left + axis.d2p(tick.v) < 0) || 
              (this.plotOffset.left + axis.d2p(tick.v) > this.canvasWidth)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top + this.plotHeight + options.grid.labelMargin), 'px;left:', 
            (this.plotOffset.left +axis.d2p(tick.v) - xBoxWidth/2), 'px;width:', 
            xBoxWidth, 'px;text-align:center;', (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label">', tick.label, '</div>'
          );
        }
      }
      
      // Add x2 labels.
      axis = a.x2;
      if (axis.options.showLabels && axis.used){
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if(!tick.label || tick.label.length == 0 || 
              (this.plotOffset.left + axis.d2p(tick.v) < 0) || 
              (this.plotOffset.left + axis.d2p(tick.v) > this.canvasWidth)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top - options.grid.labelMargin - axis.maxLabel.height), 'px;left:', 
            (this.plotOffset.left + axis.d2p(tick.v) - xBoxWidth/2), 'px;width:', 
            xBoxWidth, 'px;text-align:center;', (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label">', tick.label, '</div>'
          );
        }
      }
      
      // Add y labels.
      axis = a.y;
      if (axis.options.showLabels){
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if (!tick.label || tick.label.length == 0 ||
               (this.plotOffset.top + axis.d2p(tick.v) < 0) || 
               (this.plotOffset.top + axis.d2p(tick.v) > this.canvasHeight)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top + axis.d2p(tick.v) - axis.maxLabel.height/2), 'px;left:0;width:', 
            (this.plotOffset.left - options.grid.labelMargin), 'px;text-align:right;', 
            (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label flotr-grid-label-y">', tick.label, '</div>'
          );
        }
      }
      
      // Add y2 labels.
      axis = a.y2;
      if (axis.options.showLabels && axis.used){
        ctx.save();
        ctx.strokeStyle = axis.options.color || options.grid.color;
        ctx.beginPath();
        
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if (!tick.label || tick.label.length == 0 ||
               (this.plotOffset.top + axis.d2p(tick.v) < 0) || 
               (this.plotOffset.top + axis.d2p(tick.v) > this.canvasHeight)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top + axis.d2p(tick.v) - axis.maxLabel.height/2), 'px;right:0;width:', 
            (this.plotOffset.right - options.grid.labelMargin), 'px;text-align:left;', 
            (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label flotr-grid-label-y">', tick.label, '</div>'
          );

          ctx.moveTo(this.plotOffset.left + this.plotWidth - 8, this.plotOffset.top + axis.d2p(tick.v));
          ctx.lineTo(this.plotOffset.left + this.plotWidth,     this.plotOffset.top + axis.d2p(tick.v));
        }
        ctx.stroke();
        ctx.restore();
      }
      
      html = html.join('');

      var div = D.create('div');
      D.setStyles(div, {
        fontSize: 'smaller',
        color: options.grid.color 
      });
      div.className = 'flotr-labels';
      D.insert(this.el, div);
      D.insert(div, html);
    }

    function drawLabelCircular (graph, axis, minorTicks) {
      var
        ticks = minorTicks ? axis.minorTicks : axis.ticks,
        isX     = axis.orientation === 1,
        isFirst = axis.n === 1,
        offset;

      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < ticks.length &&
          (minorTicks ? axis.options.showMinorLabels : axis.options.showLabels); ++i){
        tick = ticks[i];
        tick.label += '';
        if(!tick.label || !tick.label.length) { continue; }
        
        x = Math.cos(i*coeff+angle) * radius; 
        y = Math.sin(i*coeff+angle) * radius;
            
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = isX ? (Math.abs(x) < 0.1 ? 'center' : (x < 0 ? 'right' : 'left')) : 'left';
        
        Flotr.drawText(
          ctx, tick.label,
          isX ? x : 3,
          isX ? y : -(axis.ticks[i].v / axis.max) * (radius - options.fontSize),
          style);
      }
    }
    function drawLabelNoHtmlText (graph, axis, textAlign, textBaseline)  {
      var
        isX     = axis.orientation === 1,
        isFirst = axis.n === 1,
        offset;

      style.color = axis.options.color || options.grid.color;
      for (i = 0; i < axis.ticks.length && continueShowingLabels(axis); ++i) {
        
        tick = axis.ticks[i];
        if (!tick.label || !tick.label.length) { continue; }
   
        offset = axis.d2p(tick.v);
        if (offset < 0 ||
            offset > (isX ? graph.plotWidth : graph.plotHeight)) { continue; }
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = textAlign;
        style.textBaseline = textBaseline;
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          leftOffset(graph, isX, isFirst, offset),
          topOffset(graph, isX, isFirst, offset),
          style
        );

        // Only draw on axis y2
        if (!isX && !isFirst) {
          ctx.save();
          ctx.strokeStyle = style.color;
          ctx.beginPath();
          ctx.moveTo(graph.plotOffset.left + graph.plotWidth - 8, graph.plotOffset.top + axis.d2p(tick.v));
          ctx.lineTo(graph.plotOffset.left + graph.plotWidth, graph.plotOffset.top + axis.d2p(tick.v));
          ctx.stroke();
          ctx.restore();
        }
      }
      function continueShowingLabels (axis) {
        return axis.options.showLabels && axis.used;
      }
      function leftOffset (graph, isX, isFirst, offset) {
        return graph.plotOffset.left +
          (isX ? offset :
            (isFirst ?
              -options.grid.labelMargin :
              options.grid.labelMargin + graph.plotWidth));
      }
      function topOffset (graph, isX, isFirst, offset) {
        return graph.plotOffset.top +
          (isX ? options.grid.labelMargin : offset) +
          ((isX && isFirst) ? graph.plotHeight : 0);
      }
    }
  }

});
})();
