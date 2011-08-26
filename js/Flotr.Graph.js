/**
 * Flotr Graph class that plots a graph on creation.
 */
(function () {

  var D = Flotr.DOM,
    E = Flotr.EventAdapter;

/**
 * Flotr Graph constructor.
 * @param {Element} el - element to insert the graph into
 * @param {Object} data - an array or object of dataseries
 * @param {Object} options - an object containing options
 */
Flotr.Graph = function(el, data, options){

//  try {
    this._setEl(el);
    this._initMembers();
    this._initPlugins();

    E.fire(this.el, 'flotr:beforeinit', [this]);

    this.data = data;
    this.series = Flotr.Series.getSeries(data);
    this._initOptions(options);
    this._initGraphTypes();
    this._initCanvas();
    E.fire(this.el, 'flotr:afterconstruct', [this]);
    this._initEvents();
  
    this.findDataRanges();
    this.calculateSpacing();

    this.draw(_.bind(function() {
      E.fire(this.el, 'flotr:afterinit', [this]);
    }, this));

    try {
  } catch (e) {
    try {
      console.error(e);
    } catch (e2) {}
  }
};

Flotr.Graph.prototype = {

  destroy: function () {
    _.each(this._handles, function (handle) {
      E.stopObserving.apply(this, handle);
    });
    this._handles = [];
    this.el.graph = null;
  },

  _observe: function (object, name, callback) {
    E.observe.apply(this, arguments);
    this._handles.push(arguments);
    return this;
  },

  /**
   * Get graph type for a series
   * @param {Object} series - the series
   * @return {Object} the graph type
   */
  getType: function(series){
    var t = (series && series.type) ? series.type : this.options.defaultType;
    return this[t];
  },
  /**
   * Try a method on a graph type.  If the method exists, execute it.
   * @param {Object} series
   * @param {String} method  Method name.
   * @param {Array} args  Arguments applied to method.
   * @return executed successfully or failed.
   */
  executeOnType: function(s, method, args){
    var success = false;
    if (!_.isArray(s)) s = [s];

    function e(s) {
      _.each(_.keys(Flotr.graphTypes), function (type) {
        if (s[type] && s[type].show) {
          try {
            if (!_.isUndefined(args))
                this[type][method].apply(this[type], args);
            else
                this[type][method].apply(this[type]);
            success = true;
          } catch (e) {}
        }
      }, this);
    }
    _.each(s, e, this);

    return success;
  },
  processColor: function(color, options){
    var o = { x1: 0, y1: 0, x2: this.plotWidth, y2: this.plotHeight, opacity: 1, ctx: this.ctx };
    _.extend(o, options);
    return Flotr.Color.processColor(color, o);
  },
  /**
   * Calculates a text box dimensions, wether it is drawn on the canvas or inserted into the DOM
   * @param {String} text - The text in the box
   * @param {Object} canvasStyle - An object containing the style for the text if drawn on the canvas
   * @param {String} HtmlStyle - A CSS style for the text if inserted into the DOM
   * @param {Object} className - A CSS className for the text if inserted into the DOM
   */
  getTextDimensions: function(text, canvasStyle, HtmlStyle, className) {
    if (!text) return {width:0, height:0};
    
    if (!this.options.HtmlText && this.textEnabled) {
      var bounds = this.ctx.getTextBounds(text, canvasStyle);
      return {
        width: bounds.width+2, 
        height: bounds.height+6
      };
    }
    else {
      var dummyDiv = D.create('div');
      D.setStyles(dummyDiv, {'position':'absolute', 'top':'-10000px'});
      D.insert(dummyDiv, '<div style="'+HtmlStyle+'" class="'+className+' flotr-dummy-div">' + text + '</div>');
      D.insert(this.el, dummyDiv);
      return D.size(dummyDiv);
    }
  },
  /**
   * Function determines the min and max values for the xaxis and yaxis.
   *
   * TODO logarithmic range validation (consideration of 0)
   */
  findDataRanges: function(){
    var a = this.axes,
      xaxis, yaxis, range;
    
    a.x.datamin = a.x2.datamin = a.y.datamin = a.y2.datamin = Number.MAX_VALUE;
    a.x.datamax = a.x2.datamax = a.y.datamax = a.y2.datamax = -Number.MAX_VALUE;

    _.each(this.series, function (series) {
      range = series.getRange();
      if (range) {
        xaxis = series.xaxis;
        yaxis = series.yaxis;
        xaxis.datamin = Math.min(range.xmin, xaxis.datamin);
        xaxis.datamax = Math.max(range.xmax, xaxis.datamax);
        yaxis.datamin = Math.min(range.ymin, yaxis.datamin);
        yaxis.datamax = Math.max(range.ymax, yaxis.datamax);
        xaxis.used = (xaxis.used || range.xused ? true : false);
        yaxis.used = (yaxis.used || range.yused ? true : false);
      }
    }, this);

    this.calculateRange(a.x, 'x');
    if (a.x2.used) {
      this.calculateRange(a.x2, 'x');
    }

    this.calculateRange(a.y, 'y');
    if (a.y2.used) {
      this.calculateRange(a.y2, 'y');
    }
  },
  extendRange: function(axis, type) {
    var f = (type === 'y') ? 'extendYRange' : 'extendXRange';
    for (var t in Flotr.graphTypes) {
      if(this.options[t] && this.options[t].show){
        if (this[t][f])  this[t][f](axis);
      } else {
        var extend = false;
        for (i =0 ; i<this.series.length; i++){
          var serie = this.series[i];
          if(serie[t] && serie[t].show){
            extend = true;
            break;
            }
          }
        if(extend)
          if (this[t][f]) this[t][f](axis);
      }
    }
  },
  /**
   * Calculates the range of an axis to apply autoscaling.
   * @param {Object} axis - The axis for what the range will be calculated
   */
  calculateRange: function(axis, type){
    var o = axis.options,
        min = o.min != null ? o.min : axis.datamin,
        max = o.max != null ? o.max : axis.datamax,
        margin = o.autoscaleMargin;
        
    if (o.scaling == 'logarithmic') {
      if (min <= 0) min = axis.datamin;

      // Let it widen later on
      if (max <= 0) max = min;
    }

    if(max - min == 0.0){
      var widen = (max == 0.0) ? 1.0 : 0.01;
      min -= widen;
      max += widen;
    }

    if (o.scaling === 'logarithmic') {
      if (min < 0) min = max / o.base;  // Could be the result of widening

      var maxexp = Math.log(max);
      if (o.base != Math.E) maxexp /= Math.log(o.base);
      maxexp = Math.ceil(maxexp);

      var minexp = Math.log(min);
      if (o.base != Math.E) minexp /= Math.log(o.base);
      minexp = Math.ceil(minexp);
      
      axis.tickSize = Flotr.getTickSize(o.noTicks, minexp, maxexp, o.tickDecimals === null ? 0 : o.tickDecimals);
                        
      // Try to determine a suitable amount of miniticks based on the length of a decade
      if (o.minorTickFreq === null) {
        if (maxexp - minexp > 10)
          o.minorTickFreq = 0;
        else if (maxexp - minexp > 5)
          o.minorTickFreq = 2;
        else
          o.minorTickFreq = 5;
      }
    } else {
      axis.tickSize = Flotr.getTickSize(o.noTicks, min, max, o.tickDecimals);
    }

    axis.min = min;
    axis.max = max; //extendRange may use axis.min or axis.max, so it should be set before it is caled
    
    this.extendRange(axis, type);//extendRange probably changed axis.min and axis.max
    
    // Autoscaling. @todo This probably fails with log scale. Find a testcase and fix it
    if(o.min == null && o.autoscale){
      axis.min -= axis.tickSize * margin;
      // Make sure we don't go below zero if all values are positive.
      if(axis.min < 0 && axis.datamin >= 0) axis.min = 0;
      axis.min = axis.tickSize * Math.floor(axis.min / axis.tickSize);
    }
    
    if(o.max == null && o.autoscale){
      axis.max += axis.tickSize * margin;
      if(axis.max > 0 && axis.datamax <= 0 && axis.datamax != axis.datamin) axis.max = 0;        
      axis.max = axis.tickSize * Math.ceil(axis.max / axis.tickSize);
    }

    if (axis.min == axis.max) axis.max = axis.min + 1;
  },
  /**
   * Calculates axis label sizes.
   */
  calculateSpacing: function(){

    var a = this.axes,
        options = this.options,
        series = this.series,
        margin = options.grid.labelMargin,
        x = a.x,
        x2 = a.x2,
        y = a.y,
        y2 = a.y2,
        maxOutset = 2,
        i, j, l, dim;

    // TODO post refactor, fix this
    _.each(a, function (axis) {
      axis.calculateTicks();
    });
    
    // Labels width and height
    _.each([x, x2, y, y2], function(axis) {
      var maxLabel = '';
      
      if (axis.options.showLabels) {
        for(i = 0; i < axis.ticks.length; ++i){
          l = axis.ticks[i].label.length;
          if(l > maxLabel.length){
            maxLabel = axis.ticks[i].label;
          }
        }
      }
      axis.maxLabel  = this.getTextDimensions(maxLabel, {size:options.fontSize, angle: Flotr.toRad(axis.options.labelsAngle)}, 'font-size:smaller;', 'flotr-grid-label');
      axis.titleSize = this.getTextDimensions(axis.options.title, {size: options.fontSize*1.2, angle: Flotr.toRad(axis.options.titleAngle)}, 'font-weight:bold;', 'flotr-axis-title');
    }, this);

    // Title height
    dim = this.getTextDimensions(options.title, {size: options.fontSize*1.5}, 'font-size:1em;font-weight:bold;', 'flotr-title');
    this.titleHeight = dim.height;

    // Subtitle height
    dim = this.getTextDimensions(options.subtitle, {size: options.fontSize}, 'font-size:smaller;', 'flotr-subtitle');
    this.subtitleHeight = dim.height;

    // Grid outline line width.
    if(options.show){
      maxOutset = Math.max(maxOutset, options.points.radius + options.points.lineWidth/2);
    }
    for(j = 0; j < options.length; ++j){
      if (series[j].points.show){
        maxOutset = Math.max(maxOutset, series[j].points.radius + series[j].points.lineWidth/2);
      }
    }
    
    var p = this.plotOffset;
    if (x.options.margin === false) {
      p.bottom = 0;
      p.top    = 0;
    } else {
      p.bottom += (options.grid.circular ? 0 : (x.options.showLabels ?  (x.maxLabel.height + margin) : 0)) + 
                  (x.options.title ? (x.titleSize.height + margin) : 0) + maxOutset;
    
      p.top    += (options.grid.circular ? 0 : (x2.options.showLabels ? (x2.maxLabel.height + margin) : 0)) + 
                  (x2.options.title ? (x2.titleSize.height + margin) : 0) + this.subtitleHeight + this.titleHeight + maxOutset;
    }
    
    if (y.options.margin === false) {
      p.left  = 0;
      p.right = 0;
    } else {
      p.left   += (options.grid.circular ? 0 : (y.options.showLabels ?  (y.maxLabel.width + margin) : 0)) + 
                  (y.options.title ? (y.titleSize.width + margin) : 0) + maxOutset;
    
      p.right  += (options.grid.circular ? 0 : (y2.options.showLabels ? (y2.maxLabel.width + margin) : 0)) + 
                  (y2.options.title ? (y2.titleSize.width + margin) : 0) + maxOutset;
    }
    
    p.top = Math.floor(p.top); // In order the outline not to be blured
    
    this.plotWidth  = this.canvasWidth - p.left - p.right;
    this.plotHeight = this.canvasHeight - p.bottom - p.top;

    // TODO post refactor, fix this
    x.length = x2.length = this.plotWidth;
    y.length = y2.length = this.plotHeight;
    y.offset = y2.offset = this.plotHeight;
    x.setScale();
    x2.setScale();
    y.setScale();
    y2.setScale();
    /**/
  },
  /**
   * Draws grid, labels, series and outline.
   */
  draw: function(after) {
    var afterImageLoad = _.bind(function() {
      this.drawGrid();

      if(this.series.length){
        E.fire(this.el, 'flotr:beforedraw', [this.series, this]);
        
        for(var i = 0; i < this.series.length; i++){
          if (!this.series[i].hide)
            this.drawSeries(this.series[i]);
        }
      }
    
      this.drawOutline();
      E.fire(this.el, 'flotr:afterdraw', [this.series, this]);
      after();
    }, this);
    
    var g = this.options.grid;
    
    if (g && g.backgroundImage) {
      if (_.isString(g.backgroundImage)){
        g.backgroundImage = {src: g.backgroundImage, left: 0, top: 0};
      }else{
        g.backgroundImage = _.extend({left: 0, top: 0}, g.backgroundImage);
      }
      
      var img = new Image();
      img.onload = _.bind(function() {
        var left = this.plotOffset.left + (parseInt(g.backgroundImage.left) || 0);
        var top = this.plotOffset.top + (parseInt(g.backgroundImage.top) || 0);
        
        // Store the global alpha to restore it later on.
        var globalAlpha = this.ctx.globalAlpha;
        
        // When the watermarkAlpha is < 1 then the watermark is transparent. 
        this.ctx.globalAlpha = (g.backgroundImage.alpha||globalAlpha);
        
        // Draw the watermark.
        this.ctx.drawImage(img, left, top);
        
        // Set the globalAlpha back to the alpha value before changing it to
        // the grid.watermarkAlpha, otherwise the graph will be transparent also.
        this.ctx.globalAlpha = globalAlpha;
        
        afterImageLoad();
        
      }, this);
      
      img.onabort = img.onerror = afterImageLoad;
      img.src = g.backgroundImage.src;
    } else {
      afterImageLoad();
    }
  },
  /**
   * Draws a grid for the graph.
   */
  drawGrid: function(){
    var v, o = this.options,
        ctx = this.ctx, a;
        
    if(o.grid.verticalLines || o.grid.minorVerticalLines || 
           o.grid.horizontalLines || o.grid.minorHorizontalLines){
      E.fire(this.el, 'flotr:beforegrid', [this.axes.x, this.axes.y, o, this]);
    }
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = o.grid.tickColor;
    
    if (o.grid.circular) {
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = Math.min(this.plotHeight, this.plotWidth)*o.radar.radiusRatio/2,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      // Draw grid lines in vertical direction.
      ctx.beginPath();
      
      if(o.grid.horizontalLines){
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
      if(o.grid.minorHorizontalLines){
        a = this.axes.y;
        for(var i = 0; i < a.minorTicks.length; ++i){
          v = a.minorTicks[i].v;
          var ratio = v / a.max;
      
          for(var j = 0; j <= sides; ++j){
            ctx[j == 0 ? 'moveTo' : 'lineTo'](Math.cos(j*coeff+angle)*radius*ratio, Math.sin(j*coeff+angle)*radius*ratio);
          }
          //ctx.moveTo(radius*ratio, 0);
          //ctx.arc(0, 0, radius*ratio, 0, Math.PI*2, true);
        }
      }
      
      if(o.grid.verticalLines){
        for(var i = 0; i < sides; ++i){
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(i*coeff+angle)*radius, Math.sin(i*coeff+angle)*radius);
        }
      }
      ctx.stroke();
    }
    else {
      ctx.translate(this.plotOffset.left, this.plotOffset.top);
  
      // Draw grid background, if present in options.
      if(o.grid.backgroundColor != null){
        ctx.fillStyle = this.processColor(o.grid.backgroundColor, {x1: 0, y1: 0, x2: this.plotWidth, y2: this.plotHeight});
        ctx.fillRect(0, 0, this.plotWidth, this.plotHeight);
      }
      
      // Draw grid lines in vertical direction.
      ctx.beginPath();
      
      if(o.grid.verticalLines){
        a = this.axes.x;
        for(var i = 0; i < a.ticks.length; ++i){
          v = a.ticks[i].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
    
          ctx.moveTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, 0);
          ctx.lineTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, this.plotHeight);
        }
      }
      if(o.grid.minorVerticalLines){
        a = this.axes.x;
        for(var i = 0; i < a.minorTicks.length; ++i){
          v = a.minorTicks[i].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
      
          ctx.moveTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, 0);
          ctx.lineTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, this.plotHeight);
        }
      }
      
      // Draw grid lines in horizontal direction.
      if(o.grid.horizontalLines){
        a = this.axes.y;
        for(var j = 0; j < a.ticks.length; ++j){
          v = a.ticks[j].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
    
          ctx.moveTo(0, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
          ctx.lineTo(this.plotWidth, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
        }
      }
      if(o.grid.minorHorizontalLines){
        a = this.axes.y;
        for(var j = 0; j < a.minorTicks.length; ++j){
          v = a.minorTicks[j].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
    
          ctx.moveTo(0, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
          ctx.lineTo(this.plotWidth, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
        }
      }
      ctx.stroke();
    }
    
    ctx.restore();
    if(o.grid.verticalLines || o.grid.minorVerticalLines ||
       o.grid.horizontalLines || o.grid.minorHorizontalLines){
      E.fire(this.el, 'flotr:aftergrid', [this.axes.x, this.axes.y, o, this]);
    }
  }, 
  /**
   * Draws a outline for the graph.
   */
  drawOutline: function(){
    var v, o = this.options,
        ctx = this.ctx;
    
    if (o.grid.outlineWidth == 0) return;
    
    ctx.save();
    
    if (o.grid.circular) {
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = Math.min(this.plotHeight, this.plotWidth)*o.radar.radiusRatio/2,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      // Draw axis/grid border.
      ctx.beginPath();
      ctx.lineWidth = o.grid.outlineWidth;
      ctx.strokeStyle = o.grid.color;
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
      var lw = o.grid.outlineWidth,
          orig = 0.5-lw+((lw+1)%2/2);
      ctx.lineWidth = lw;
      ctx.strokeStyle = o.grid.color;
      ctx.lineJoin = 'miter';
      ctx.strokeRect(orig, orig, this.plotWidth, this.plotHeight);
    }
    
    ctx.restore();
  },
  /**
   * Actually draws the graph.
   * @param {Object} series - series to draw
   */
  drawSeries: function(series){
    series = series || this.series;
    
    var drawn = false;
    for(type in Flotr.graphTypes){
      if(series[type] && series[type].show){
        drawn = true;
        this[type].draw(series);
      }
    }
    
    if(!drawn){
      this[this.options.defaultType].draw(series);
    }
  },
  /**
   * Calculates the coordinates from a mouse event object.
   * @param {Event} event - Mouse Event object.
   * @return {Object} Object with coordinates of the mouse.
   */
  getEventPosition: function (e){

    var offset = D.position(this.overlay),
        pointer = E.eventPointer(e),
        rx = (pointer.x - offset.left - this.plotOffset.left),
        ry = (pointer.y - offset.top - this.plotOffset.top),
        dx = pointer.x - this.lastMousePos.pageX,
        dy = pointer.y - this.lastMousePos.pageY;

    return {
      x:  this.axes.x.p2d(rx),
      x2: this.axes.x2.p2d(rx),
      y:  this.axes.y.p2d(ry),
      y2: this.axes.y2.p2d(ry),
      relX: rx,
      relY: ry,
      dX: dx,
      dY: dy,
      absX: pointer.x,
      absY: pointer.y
    };
  },
  /**
   * Observes the 'click' event and fires the 'flotr:click' event.
   * @param {Event} event - 'click' Event object.
   */
  clickHandler: function(event){
    if(this.ignoreClick){
      this.ignoreClick = false;
      return this.ignoreClick;
    }
    E.fire(this.el, 'flotr:click', [this.getEventPosition(event), this]);
  },
  /**
   * Observes mouse movement over the graph area. Fires the 'flotr:mousemove' event.
   * @param {Event} event - 'mousemove' Event object.
   */
  mouseMoveHandler: function(event){
    var pos = this.getEventPosition(event);
    this.lastMousePos.pageX = pos.absX;
    this.lastMousePos.pageY = pos.absY;  
    E.fire(this.el, 'flotr:mousemove', [event, pos, this]);
  },
  /**
   * Observes the 'mousedown' event.
   * @param {Event} event - 'mousedown' Event object.
   */
  mouseDownHandler: function (event){

    /*
    // @TODO Context menu?
    if(event.isRightClick()) {
      event.stop();

      var overlay = this.overlay;
      overlay.hide();
      
      function cancelContextMenu () {
        overlay.show();
        E.stopObserving(document, 'mousemove', cancelContextMenu);
      }
      E.observe(document, 'mousemove', cancelContextMenu);
      return;
    }
    */

    // @TODO why?
    this.mouseUpHandler = _.bind(this.mouseUpHandler, this);
    E.observe(document, 'mouseup', this.mouseUpHandler);
    E.fire(this.el, 'flotr:mousedown', [event, this]);
  },
  /**
   * Observes the mouseup event for the document. 
   * @param {Event} event - 'mouseup' Event object.
   */
  mouseUpHandler: function(event){
    E.stopObserving(document, 'mouseup', this.mouseUpHandler);
    // @TODO why?
    //event.stop();
    E.fire(this.el, 'flotr:mouseup', [event, this]);
  },
  drawTooltip: function(content, x, y, options) {
    var mt = this.getMouseTrack(),
        style = 'opacity:0.7;background-color:#000;color:#fff;display:none;position:absolute;padding:2px 8px;-moz-border-radius:4px;border-radius:4px;white-space:nowrap;', 
        p = options.position, 
        m = options.margin,
        plotOffset = this.plotOffset;

    if(x !== null && y !== null){
      if (!options.relative) { // absolute to the canvas
             if(p.charAt(0) == 'n') style += 'top:' + (m + plotOffset.top) + 'px;bottom:auto;';
        else if(p.charAt(0) == 's') style += 'bottom:' + (m + plotOffset.bottom) + 'px;top:auto;';
             if(p.charAt(1) == 'e') style += 'right:' + (m + plotOffset.right) + 'px;left:auto;';
        else if(p.charAt(1) == 'w') style += 'left:' + (m + plotOffset.left) + 'px;right:auto;';
      }
      else { // relative to the mouse
             if(p.charAt(0) == 'n') style += 'bottom:' + (m - plotOffset.top - y + this.canvasHeight) + 'px;top:auto;';
        else if(p.charAt(0) == 's') style += 'top:' + (m + plotOffset.top + y) + 'px;bottom:auto;';
             if(p.charAt(1) == 'e') style += 'left:' + (m + plotOffset.left + x) + 'px;right:auto;';
        else if(p.charAt(1) == 'w') style += 'right:' + (m - plotOffset.left - x + this.canvasWidth) + 'px;left:auto;';
      }
  
      mt.style.cssText = style;
      D.empty(mt);
      D.insert(mt, content);
      D.show(mt);
    }
    else {
      D.hide(mt);
    }
  },
  saveImage: function (type, width, height, replaceCanvas) {
    var image = null;
    if (Flotr.isIE && Flotr.isIE < 9) {
      image = '<html><body>'+this.canvas.firstChild.innerHTML+'</body></html>';
      return window.open().document.write(image);
    }
      
    switch (type) {
      case 'jpeg':
      case 'jpg': image = Canvas2Image.saveAsJPEG(this.canvas, replaceCanvas, width, height); break;
      default:
      case 'png': image = Canvas2Image.saveAsPNG(this.canvas, replaceCanvas, width, height); break;
      case 'bmp': image = Canvas2Image.saveAsBMP(this.canvas, replaceCanvas, width, height); break;
    }
    if (_.isElement(image) && replaceCanvas) {
      this.restoreCanvas();
      D.hide(this.canvas);
      D.hide(this.overlay);
      D.setStyles({position: 'absolute'});
      D.insert(this.el, image);
      this.saveImageElement = image;
    }
  },
  restoreCanvas: function() {
    D.show(this.canvas);
    D.show(this.overlay);
    this.canvas.show();
    this.overlay.show();
    if (this.saveImageElement) this.el.removeChild(this.saveImageElement);
    this.saveImageElement = null;
  },

  _initMembers: function() {
    this._handles = [];
    this.lastMousePos = {pageX: null, pageY: null };
    this.plotOffset = {left: 0, right: 0, top: 0, bottom: 0};
    this.ignoreClick = false;
    this.prevHit = null;
  },

  _initGraphTypes: function() {
    var type, p;
    for (type in Flotr.graphTypes) {
      this[type] = _.clone(Flotr.graphTypes[type]);
      for (p in this[type]) {
        if (_.isFunction(this[type][p]))
          this[type][p] = _.bind(this[type][p], this);
      }
    }
  },

  _initEvents: function () {
    this.
      _observe(this.overlay, 'mousedown', _.bind(this.mouseDownHandler, this)).
      _observe(this.el, 'mousemove', _.bind(this.mouseMoveHandler, this)).
      _observe(this.overlay, 'click', _.bind(this.clickHandler, this));


    var touchEndHandler = _.bind(function (e) {
      E.stopObserving(document, 'touchend', touchEndHandler);
      E.fire(this.el, 'flotr:mouseup', [event, this]);
    }, this);

    this._observe(this.overlay, 'touchstart', _.bind(function (e) {
      E.fire(this.el, 'flotr:mousedown', [event, this]);
      this._observe(document, 'touchend', touchEndHandler);
    }, this));

    this._observe(this.overlay, 'touchmove', _.bind(function (e) {
      e.preventDefault();
      var pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY,
        pos = { absX : pageX , absY : pageY };
      this.lastMousePos.pageX = pageX;
      this.lastMousePos.pageY = pageY;  
      //console.log(pageX);
      E.fire(this.el, 'flotr:mousemove', [event, pos, this]);
    }, this));
  },

  /**
   * Initializes the canvas and it's overlay canvas element. When the browser is IE, this makes use 
   * of excanvas. The overlay canvas is inserted for displaying interactions. After the canvas elements
   * are created, the elements are inserted into the container element.
   */
  _initCanvas: function(){
    var el = this.el,
      o = this.options,
      size, style;
    
    D.empty(el);
    D.setStyles(el, {position: 'relative', cursor: el.style.cursor || 'default'}); // For positioning labels and overlay.
    size = D.size(el);

    if(size.width <= 0 || size.height <= 0 || o.resolution <= 0){
      throw 'Invalid dimensions for plot, width = ' + size.width + ', height = ' + size.height + ', resolution = ' + o.resolution;
    }
    
    // The old canvases are retrieved to avoid memory leaks ...
    // @TODO Confirm.
    // this.canvas = el.select('.flotr-canvas')[0];
    // this.overlay = el.select('.flotr-overlay')[0];
    this.canvas = getCanvas(this.canvas, 'canvas'); // Main canvas for drawing graph types
    this.overlay = getCanvas(this.overlay, 'overlay'); // Overlay canvas for interactive features
    this.ctx = getContext(this.canvas);
    this.octx = getContext(this.overlay);
    this.canvasHeight = size.height*o.resolution;
    this.canvasWidth = size.width*o.resolution;
    this.textEnabled = !!this.ctx.drawText; // Enable text functions

    function getCanvas(canvas, name){
      if(!canvas){
        canvas = D.create('canvas');
        canvas.className = 'flotr-'+name;
        canvas.style.cssText = 'position:absolute;left:0px;top:0px;';
      }
      _.each(size, function(size, attribute){
        canvas.setAttribute(attribute, size*o.resolution);
        canvas.style[attribute] = size+'px';
        D.show(canvas);
      });
      canvas.context_ = null; // Reset the ExCanvas context
      D.insert(el, canvas);
      return canvas;
    }

    function getContext(canvas){
      if(window.G_vmlCanvasManager) window.G_vmlCanvasManager.initElement(canvas); // For ExCanvas
      var context = canvas.getContext('2d');
      if(!window.G_vmlCanvasManager) context.scale(o.resolution, o.resolution);
      return context;
    }
  },

  _initPlugins: function(){
    // TODO Should be moved to Flotr and mixed in.
    var name, plugin, c;
    for (name in Flotr.plugins) {
      plugin = Flotr.plugins[name];
      for (c in plugin.callbacks) {
        this._observe(this.el, c, _.bind(plugin.callbacks[c], this));
      }
      this[name] = _.clone(plugin);
      for (p in this[name]) {
        if (_.isFunction(this[name][p]))
          this[name][p] = _.bind(this[name][p], this);
      }
    }
  },

  /**
   * Sets options and initializes some variables and color specific values, used by the constructor. 
   * @param {Object} opts - options object
   */
  _initOptions: function(opts){
    var options = Flotr.clone(Flotr.defaultOptions);
    options.x2axis = _.extend(_.clone(options.xaxis), options.x2axis);
    options.y2axis = _.extend(_.clone(options.yaxis), options.y2axis);
    this.options = Flotr.merge(opts || {}, options);

    this.axes = Flotr.Axis.getAxes(this.options);

    if (this.options.grid.minorVerticalLines === null && 
      this.options.xaxis.scaling === 'logarithmic') {
      this.options.grid.minorVerticalLines = true;
    }
    if (this.options.grid.minorHorizontalLines === null && 
      this.options.yaxis.scaling === 'logarithmic') {
      this.options.grid.minorHorizontalLines = true;
    }
    
    // Initialize some variables used throughout this function.
    var assignedColors = [],
        colors = [],
        ln = this.series.length,
        neededColors = this.series.length,
        oc = this.options.colors, 
        usedColors = [],
        variation = 0,
        c, i, j, s;

    // Collect user-defined colors from series.
    for(i = neededColors - 1; i > -1; --i){
      c = this.series[i].color;
      if(c){
        --neededColors;
        if(_.isNumber(c)) assignedColors.push(c);
        else usedColors.push(Flotr.Color.parse(c));
      }
    }
    
    // Calculate the number of colors that need to be generated.
    for(i = assignedColors.length - 1; i > -1; --i)
      neededColors = Math.max(neededColors, assignedColors[i] + 1);

    // Generate needed number of colors.
    for(i = 0; colors.length < neededColors;){
      c = (oc.length == i) ? new Flotr.Color(100, 100, 100) : Flotr.Color.parse(oc[i]);
      
      // Make sure each serie gets a different color.
      var sign = variation % 2 == 1 ? -1 : 1,
          factor = 1 + sign * Math.ceil(variation / 2) * 0.2;
      c.scale(factor, factor, factor);

      /**
       * @todo if we're getting too close to something else, we should probably skip this one
       */
      colors.push(c);
      
      if(++i >= oc.length){
        i = 0;
        ++variation;
      }
    }
  
    // Fill the options with the generated colors.
    for(i = 0, j = 0; i < ln; ++i){
      s = this.series[i];

      // Assign the color.
      if(s.color == null){
        s.color = colors[j++].toString();
      }else if(_.isNumber(s.color)){
        s.color = colors[s.color].toString();
      }
      
      // Every series needs an axis
      if (!s.xaxis) s.xaxis = this.axes.x;
           if (s.xaxis == 1) s.xaxis = this.axes.x;
      else if (s.xaxis == 2) s.xaxis = this.axes.x2;
      
      if (!s.yaxis) s.yaxis = this.axes.y;
           if (s.yaxis == 1) s.yaxis = this.axes.y;
      else if (s.yaxis == 2) s.yaxis = this.axes.y2;
      
      // Apply missing options to the series.
      for (var t in Flotr.graphTypes){
        s[t] = _.extend(_.clone(this.options[t]), s[t]);
      }
      s.mouse = _.extend(_.clone(this.options.mouse), s.mouse);
      
      if(s.shadowSize == null) s.shadowSize = this.options.shadowSize;
    }
  },

  _setEl: function(el) {
    if (!el) throw 'The target container doesn\'t exist';
    if (!el.clientWidth) throw 'The target container must be visible';
    this.el = el;

    if (this.el.graph) this.el.graph.destroy();

    this.el.graph = this;
  }
}
})();
