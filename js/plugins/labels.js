(function () {

var D = Flotr.DOM;

Flotr.addPlugin('labels', {

  callbacks : {
    'flotr:beforedraw' : function () {
      this.labels.draw();
    }
  },

  draw: function(){
    // Construct fixed width label boxes, which can be styled easily. 
    var noLabels = 0, axis,
        xBoxWidth, i, html, tick, left, top,
        options = this.options,
        ctx = this.ctx,
        a = this.axes;
    
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
          angle = -Math.PI/2;
      
      var style = {
        size: options.fontSize
      };

      // Add x labels.
      axis = a.x;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels; ++i){
        tick = axis.ticks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
        
        var x = Math.cos(i*coeff+angle) * radius, 
            y = Math.sin(i*coeff+angle) * radius;
            
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = (Math.abs(x) < 0.1 ? 'center' : (x < 0 ? 'right' : 'left'));

        Flotr.drawText(ctx, tick.label, x, y, style);
      }
      for(i = 0; i < axis.minorTicks.length && axis.options.showMinorLabels; ++i){
        tick = axis.minorTicks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
      
        var x = Math.cos(i*coeff+angle) * radius, 
            y = Math.sin(i*coeff+angle) * radius;
            
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = (Math.abs(x) < 0.1 ? 'center' : (x < 0 ? 'right' : 'left'));

        Flotr.drawText(ctx, tick.label, x, y, style);
      }
      
      // Add y labels.
      axis = a.y;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels; ++i){
        tick = axis.ticks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = 'left';
        
        Flotr.drawText(ctx, tick.label, 3, -(axis.ticks[i].v / axis.max) * (radius - options.fontSize), style);
      }
      for(i = 0; i < axis.minorTicks.length && axis.options.showMinorLabels; ++i){
        tick = axis.minorTicks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = 'left';
        
        Flotr.drawText(ctx, tick.label, 3, -(axis.ticks[i].v / axis.max) * (radius - options.fontSize), style);
      }
      ctx.restore();
      return;
    }
    
    if (!options.HtmlText && this.textEnabled) {
      var style = {
        size: options.fontSize
      };
  
      // Add x labels.
      axis = a.x;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if(!tick.label || tick.label.length == 0) continue;
        
        left = axis.d2p(tick.v);
        if (left < 0 || left > this.plotWidth) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'center';
        style.textBaseline = 'top';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left + left, 
          this.plotOffset.top + this.plotHeight + options.grid.labelMargin,
          style
        );
      }
        
      // Add x2 labels.
      axis = a.x2;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if(!tick.label || tick.label.length == 0) continue;
        
        left = axis.d2p(tick.v);
        if(left < 0 || left > this.plotWidth) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'center';
        style.textBaseline = 'bottom';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left + left, 
          this.plotOffset.top + options.grid.labelMargin,
          style
        );
      }
        
      // Add y labels.
      axis = a.y;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if (!tick.label || tick.label.length == 0) continue;
        
        top = axis.d2p(tick.v);
        if(top < 0 || top > this.plotHeight) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'right';
        style.textBaseline = 'middle';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left - options.grid.labelMargin, 
          this.plotOffset.top + top,
          style
        );
      }
        
      // Add y2 labels.
      axis = a.y2;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if (!tick.label || tick.label.length == 0) continue;
        
        top = axis.d2p(tick.v);
        if(top < 0 || top > this.plotHeight) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'left';
        style.textBaseline = 'middle';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left + this.plotWidth + options.grid.labelMargin, 
          this.plotOffset.top + top,
          style
        );
        
        ctx.save();
        ctx.strokeStyle = style.color;
        ctx.beginPath();
        ctx.moveTo(this.plotOffset.left + this.plotWidth - 8, this.plotOffset.top + axis.d2p(tick.v));
        ctx.lineTo(this.plotOffset.left + this.plotWidth,     this.plotOffset.top + axis.d2p(tick.v));
        ctx.stroke();
        ctx.restore();
      }
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
  },


});
})();
