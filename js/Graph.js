/**
 * Flotr Graph class that plots a graph on creation.
 */
(function () {

var
  D     = Flotr.DOM,
  E     = Flotr.EventAdapter,
  _     = Flotr._;
  flotr = Flotr;
/**
 * Flotr Graph constructor.
 * @param {Element} el - element to insert the graph into
 * @param {Object} data - an array or object of dataseries
 * @param {Object} options - an object containing options
 */
Graph = function(el, data, options){
// Let's see if we can get away with out this [JS]
//  try {
    this._setEl(el);
    this._initMembers();
    this._initPlugins();

    E.fire(this.el, 'flotr:beforeinit', [this]);

    this.data = data;
    this.series = flotr.Series.getSeries(data);
    this._initOptions(options);
    this._initGraphTypes();
    this._initCanvas();
    this._text = new flotr.Text({
      element : this.el,
      ctx : this.ctx,
      html : this.options.HtmlText,
      textEnabled : this.textEnabled
    });
    E.fire(this.el, 'flotr:afterconstruct', [this]);
    this._initEvents();

    this.findDataRanges();
    this.calculateSpacing();

    this.draw(_.bind(function() {
      E.fire(this.el, 'flotr:afterinit', [this]);
    }, this));
/*
    try {
  } catch (e) {
    try {
      console.error(e);
    } catch (e2) {}
  }*/
};

Graph.prototype = {

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
      _.each(_.keys(flotr.graphTypes), function (type) {
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
    return flotr.Color.processColor(color, o);
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

    // Check for empty data, no data case (none used)
    if (!a.x.used && !a.x2.used) a.x.used = true;
    if (!a.y.used && !a.y2.used) a.y.used = true;

    _.each(a, function (axis) {
      axis.calculateRange();
    });

    var types = _.keys(flotr.graphTypes);

    _.each(this.series, function (series) {
      _.each(types, function (type) {
        if (series[type] && series[type].show) {
          if (this[type].extendRange) this[type].extendRange(series);
          if (this[type].extendYRange) this[type].extendYRange(series.yaxis);
          if (this[type].extendXRange) this[type].extendXRange(series.xaxis);
        }
      }, this);
    }, this);
  },

  /**
   * Calculates axis label sizes.
   */
  calculateSpacing: function(){

    var a = this.axes,
        options = this.options,
        series = this.series,
        margin = options.grid.labelMargin,
        T = this._text,
        x = a.x,
        x2 = a.x2,
        y = a.y,
        y2 = a.y2,
        maxOutset = options.grid.outlineWidth,
        i, j, l, dim;

    // TODO post refactor, fix this
    _.each(a, function (axis) {
      axis.calculateTicks();
      axis.calculateTextDimensions(T, options);
    });

    // Title height
    dim = T.dimensions(
      options.title,
      {size: options.fontSize*1.5},
      'font-size:1em;font-weight:bold;',
      'flotr-title'
    );
    this.titleHeight = dim.height;

    // Subtitle height
    dim = T.dimensions(
      options.subtitle,
      {size: options.fontSize},
      'font-size:smaller;',
      'flotr-subtitle'
    );
    this.subtitleHeight = dim.height;

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
      p.bottom += (options.grid.circular ? 0 : (x.used && x.options.showLabels ?  (x.maxLabel.height + margin) : 0)) +
                  (x.used && x.options.title ? (x.titleSize.height + margin) : 0) + maxOutset;

      p.top    += (options.grid.circular ? 0 : (x2.used && x2.options.showLabels ? (x2.maxLabel.height + margin) : 0)) +
                  (x2.used && x2.options.title ? (x2.titleSize.height + margin) : 0) + this.subtitleHeight + this.titleHeight + maxOutset;
    }
    if (y.options.margin === false) {
      p.left  = 0;
      p.right = 0;
    } else {
      p.left   += (options.grid.circular ? 0 : (y.used && y.options.showLabels ?  (y.maxLabel.width + margin) : 0)) +
                  (y.used && y.options.title ? (y.titleSize.width + margin) : 0) + maxOutset;

      p.right  += (options.grid.circular ? 0 : (y2.used && y2.options.showLabels ? (y2.maxLabel.width + margin) : 0)) +
                  (y2.used && y2.options.title ? (y2.titleSize.width + margin) : 0) + maxOutset;
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
  },
  /**
   * Draws grid, labels, series and outline.
   */
  draw: function(after) {
    var afterImageLoad = _.bind(function() {

      if(this.series.length){
        E.fire(this.el, 'flotr:beforedraw', [this.series, this]);

        for(var i = 0; i < this.series.length; i++){
          if (!this.series[i].hide)
            this.drawSeries(this.series[i]);
        }
      }

      this.clip();
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
   * Actually draws the graph.
   * @param {Object} series - series to draw
   */
  drawSeries: function(series){
    series = series || this.series;

    var drawn = false;
    _.each(flotr.graphTypes, function(handler, name) {
      if(series[name] && series[name].show){
        drawn = true;
        handler.draw.call(this, series);
      }
    }, this);

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

    var d = document,
        r = this.overlay.getBoundingClientRect(),
        pointer = E.eventPointer(e),
        rx = e.clientX - d.body.scrollLeft - d.documentElement.scrollLeft - r.left - this.plotOffset.left,
        ry = e.clientY - d.body.scrollTop - d.documentElement.scrollTop - r.top - this.plotOffset.top,
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

  clip: function () {

    var
      ctx = this.ctx,
      o   = this.plotOffset,
      w   = this.canvasWidth,
      h   = this.canvasHeight;

    if (flotr.isIE && flotr.isIE < 9) {
      // Clipping for excanvas :-(
      ctx.save();
      ctx.fillStyle = this.processColor(this.options.ieBackgroundColor);
      ctx.fillRect(0, 0, w, o.top);
      ctx.fillRect(0, 0, o.left, h);
      ctx.fillRect(0, h - o.bottom, w, o.bottom);
      ctx.fillRect(w - o.right, 0, o.right,h);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, w, o.top);
      ctx.clearRect(0, 0, o.left, h);
      ctx.clearRect(0, h - o.bottom, w, o.bottom);
      ctx.clearRect(w - o.right, 0, o.right,h);
    }
  },

  _initMembers: function() {
    this._handles = [];
    this.lastMousePos = {pageX: null, pageY: null };
    this.plotOffset = {left: 0, right: 0, top: 0, bottom: 0};
    this.ignoreClick = false;
    this.prevHit = null;
  },

  _initGraphTypes: function() {
    _.each(flotr.graphTypes, function(handler, graphType){
      this[graphType] = _.clone(handler);
      _.each(handler, function(fn, name){
        if (_.isFunction(fn))
          this[graphType][name] = _.bind(fn, this);
      }, this);
    }, this);

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
        pos = this.getEventPosition(e.touches[0]);

      this.lastMousePos.pageX = pageX;
      this.lastMousePos.pageY = pageY;
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
    // TODO Should be moved to flotr and mixed in.
    _.each(flotr.plugins, function(plugin, name){
      _.each(plugin.callbacks, function(fn, c){
        this._observe(this.el, c, _.bind(fn, this));
      }, this);
      this[name] = _.clone(plugin);
      _.each(this[name], function(fn, p){
        if (_.isFunction(fn))
          this[name][p] = _.bind(fn, this);
      }, this);
    }, this);
  },

  /**
   * Sets options and initializes some variables and color specific values, used by the constructor.
   * @param {Object} opts - options object
   */
  _initOptions: function(opts){
    var options = flotr.clone(flotr.defaultOptions);
    options.x2axis = _.extend(_.clone(options.xaxis), options.x2axis);
    options.y2axis = _.extend(_.clone(options.yaxis), options.y2axis);
    this.options = flotr.merge(opts || {}, options);

    this.axes = flotr.Axis.getAxes(this.options);

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
        else usedColors.push(flotr.Color.parse(c));
      }
    }

    // Calculate the number of colors that need to be generated.
    for(i = assignedColors.length - 1; i > -1; --i)
      neededColors = Math.max(neededColors, assignedColors[i] + 1);

    // Generate needed number of colors.
    for(i = 0; colors.length < neededColors;){
      c = (oc.length == i) ? new flotr.Color(100, 100, 100) : flotr.Color.parse(oc[i]);

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
      for (var t in flotr.graphTypes){
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
};

Flotr.Graph = Graph;

})();
