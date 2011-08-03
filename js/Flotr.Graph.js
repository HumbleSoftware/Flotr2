/**
 * Flotr Graph class that plots a graph on creation.
 */
(function () {

  var D = Flotr.DOM;

  // TODO Find a home for this.
  function eventPointer(e) {
    if (Flotr.isIE && Flotr.isIE < 9) {
      return {x: e.clientX + document.body.scrollLeft, y: e.clientY + document.body.scrollTop};
    } else {
      return {x: e.pageX, y: e.pageY};
    }
  }

/**
 * Flotr Graph constructor.
 * @param {Element} el - element to insert the graph into
 * @param {Object} data - an array or object of dataseries
 * @param {Object} options - an object containing options
 */
Flotr.Graph = function(el, data, options){

  try {
    this._setEl(el);

    this._initPlugins();

    Flotr.EventAdapter.fire(this.el, 'flotr:beforeinit', [this]);

    this._initMembers();
    this.data = data;
    this.series = Flotr.getSeries(data);
    this._initOptions(options);
    this._initGraphTypes();
    this._initCanvas();
    Flotr.EventAdapter.fire(this.el, 'flotr:afterconstruct', [this]);
    this._initEvents();
  
    this.findDataRanges();
    this.calculateTicks(this.axes.x);
    this.calculateTicks(this.axes.x2);
    this.calculateTicks(this.axes.y);
    this.calculateTicks(this.axes.y2);

    this.calculateSpacing();
    this.setupAxes();

    this.draw(_.bind(function() {
      Flotr.EventAdapter.fire(this.el, 'flotr:afterinit', [this]);
    }, this));

  } catch (e) {
    try {
      console.error(e);
    } catch (e2) {}
  }
};

Flotr.Graph.prototype = {
  /**
   * Sets options and initializes some variables and color specific values, used by the constructor. 
   * @param {Object} opts - options object
   */
  _initOptions: function(opts){
    var options = Flotr.clone(Flotr.defaultOptions);
    options.x2axis = _.extend(_.clone(options.xaxis), options.x2axis);
    options.y2axis = _.extend(_.clone(options.yaxis), options.y2axis);
    this.options = Flotr.merge(opts || {}, options);
    
    // The 4 axes of the plot
    this.axes = {
      x:  {options: this.options.xaxis,  n: 1}, 
      x2: {options: this.options.x2axis, n: 2}, 
      y:  {options: this.options.yaxis,  n: 1}, 
      y2: {options: this.options.y2axis, n: 2}
    };
    
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
  setupAxes: function(){
    /**
     * Translates data number to pixel number
     * @param {Number} v - data number
     * @return {Number} translated pixel number
     */
    function d2p(v, o){
      if (o.scaling === 'logarithmic') {
        v = Math.log(Math.max(v, Number.MIN_VALUE));
        if (o.base !== Math.E) 
          v /= Math.log(o.base);
      }
      return v;
    }

    /**
     * Translates pixel number to data number
     * @param {Number} v - pixel data
     * @return {Number} translated data number
     */
    function p2d(v, o){
      if (o.scaling === 'logarithmic')
        v = (o.base === Math.E) ? Math.exp(v) : Math.pow(o.base, v);
      return v;
    }

    var x = this.axes.x, 
        x2 = this.axes.x2, 
        y = this.axes.y, 
        y2 = this.axes.y2,
        pw = this.plotWidth, 
        ph = this.plotHeight;

    x.scale  = pw / (d2p(x.max, x.options) - d2p(x.min, x.options));
    x2.scale = pw / (d2p(x2.max, x2.options) - d2p(x2.min, x2.options));
    y.scale  = ph / (d2p(y.max, y.options) - d2p(y.min, y.options));
    y2.scale = ph / (d2p(y2.max, y2.options) - d2p(y2.min, y2.options));

    if (this.options.scaling === 'logarithmic') {
        x.d2p = x2.d2p = function(xval){
          var o = this.options;
          return (d2p(xval, o) - d2p(this.min, o)) * this.scale;
        };

        x.p2d = this.axes.x2.p2d = function(xval){
          var o = this.options;
          return p2d(xval / this.scale + d2p(this.min, o), o);
        };

        y.d2p = y2.d2p = function(yval){
          var o = this.options;
          return ph - (d2p(yval, o) - d2p(this.min, o)) * this.scale;
        };

        y.p2d = y2.p2d = function(yval){
          var o = this.options;
          return p2d((ph - yval) / this.scale + d2p(this.min, o), o);
        };
    } else {
        x.d2p = x2.d2p = function(xval){
          return (xval - this.min) * this.scale;
        };

        x.p2d = this.axes.x2.p2d = function(xval){
          return xval / this.scale + this.min;
        };

        y.d2p = y2.d2p = function(yval){
          return ph - (yval - this.min) * this.scale;
        };

        y.p2d = y2.p2d = function(yval){
          return (ph - yval) / this.scale + this.min;
        };
    }
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
  processColor: function(color, options){
    var o = { x1: 0, y1: 0, x2: this.plotWidth, y2: this.plotHeight, opacity: 1, ctx: this.ctx };
    _.extend(o, options);
    return Flotr.Color.processColor(color, o);
  },
  _initPlugins: function(){
    // TODO Should be moved to Flotr and mixed in.
    var name, plugin, c, boundCallback;
    Flotr.EventAdapter.fire(this.el, 'flotr:cleanup', [this]);
    Flotr.EventAdapter.stopObserving(this.el, 'flotr:cleanup');
    for (name in Flotr.plugins) {
      plugin = Flotr.plugins[name];
      for (c in plugin.callbacks) {
        boundCallback = _.bind(plugin.callbacks[c], this);
        Flotr.EventAdapter.observe(this.el, c, boundCallback);
        Flotr.EventAdapter.observe(this.el, 'flotr:cleanup', _.bind(Flotr.EventAdapter.stopObserving, this, this.el, c, boundCallback));
        boundCallback = null;
      }
      this[name] = _.clone(plugin);
      for (p in this[name]) {
        if (_.isFunction(this[name][p]))
          this[name][p] = _.bind(this[name][p], this);
      }
    }
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
   * Initializes event some handlers.
   */
  _initEvents: function () {
    var mousedown = _.bind(this.mouseDownHandler, this);
    var mousemove = _.bind(this.mouseMoveHandler, this);
    var click = _.bind(this.clickHandler, this);

    Flotr.EventAdapter.
      observe(this.overlay, 'mousedown', mousedown).
      observe(this.el, 'flotr:cleanup', _.bind(Flotr.EventAdapter.stopObserving, this, this.overlay, 'mousedown', mousedown)).
      observe(this.overlay, 'mousemove', mousemove).
      observe(this.el, 'flotr:cleanup', _.bind(Flotr.EventAdapter.stopObserving, this, this.overlay, 'mousemove', mousemove)).
      observe(this.overlay, 'click', click).
      observe(this.el, 'flotr:cleanup', _.bind(Flotr.EventAdapter.stopObserving, this, this.overlay, 'click', click));
    mousedown = mousemove = click = null;
  },
  /**
   * Function determines the min and max values for the xaxis and yaxis.
   */
  findDataRanges: function(){
    var s = this.series, 
        a = this.axes,
        yLogarithmic, yLogarithmic,
        i, j, h, x, y, data, xaxis, yaxis, length, xmax, xmin, ymax, ymin, xused, yused;
    
    a.x.datamin = a.x2.datamin = a.y.datamin = a.y2.datamin = Number.MAX_VALUE;
    a.x.datamax = a.x2.datamax = a.y.datamax = a.y2.datamax = -Number.MAX_VALUE;

    if(s.length > 0){

      // Get datamin, datamax start values 
      for(i = 0; i < s.length; ++i) {
        data = s[i].data;
        xaxis = s[i].xaxis;
        yaxis = s[i].yaxis;
        xmin = xaxis.datamin;
        xmax = xaxis.datamax;
        ymin = yaxis.datamin;
        ymax = yaxis.datamax;
        xused = xaxis.used;
        yused = yaxis.used;

        xLogarithmic = (xaxis.options.scaling === 'logarithmic');
        yLogarithmic = (yaxis.options.scaling === 'logarithmic');

        if (data.length > 0 && !s[i].hide) {
          length = data.length;
          for(h = 0; h < length; h++){
            x = data[h][0];
            y = data[h][1];
            
            // Logarithm is only defined for values > 0
            if (xLogarithmic && (x <= 0)) continue;

            if(x < xmin) {
              xmin = x;
              xused = true;
            }

            if(x > xmax) {
              xmax = x;
              xused = true;
            }

            // Logarithm is only defined for values > 0
            if (yLogarithmic && (y <= 0)) continue;

            if(y < ymin) {
              ymin = y;
              yused = true;
            }

            if(y > ymax) {
              ymax = y;
              yused = true;
            }
          }
        }

        xaxis.datamin = xmin;
        xaxis.datamax = xmax;
        yaxis.datamin = ymin;
        yaxis.datamax = ymax;
        xaxis.used = xused;
        yaxis.used = yused;
      }
    }
    
    this.findAxesValues();
    
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
   * Find every values of the x axes or when horizontal stacked bar chart is used also y axes
   */
  findAxesValues: function(){
    var i, j, s;
    for(i = this.series.length-1; i > -1 ; --i){
      s = this.series[i];
      if(!this.executeOnType(this.series, 'findAxesValues', [s])){
        this.findXAxesValues(s);
      }
    }
  },
  /** 
   * Find every values of the x axes
   */
  findXAxesValues: function(s){
    var  j;
    s.xaxis.values = s.xaxis.values || {};
    for (j = s.data.length-1; j > -1 ; --j){
      s.xaxis.values[s.data[j][0]+''] = {};
    }
  },
  /** 
   * Find every values of the y axes
   */
  findYAxesValues: function(s){
    var j;
      s.yaxis.values = s.yaxis.values || {};
      for (j = s.data.length-1; j > -1 ; --j){
        s.yaxis.values[s.data[j][1]+''] = {};
      }
  },
  /**
   * Calculate axis ticks.
   * @param {Object} axis - The axis for what the ticks will be calculated
   */
  calculateTicks: function(axis){
    var o = axis.options, i, v;
    
    axis.ticks = [];  
    axis.minorTicks = [];
    
    if(o.ticks){
      var ticks = o.ticks, 
          minorTicks = o.minorTicks || [], 
          t, label;

      if(_.isFunction(ticks)){
        ticks = ticks({min: axis.min, max: axis.max});
      }
      
      if(_.isFunction(minorTicks)){
        minorTicks = minorTicks({min: axis.min, max: axis.max});
      }
      
      // Clean up the user-supplied ticks, copy them over.
      for(i = 0; i < ticks.length; ++i){
        t = ticks[i];
        if(typeof(t) === 'object'){
          v = t[0];
          label = (t.length > 1) ? t[1] : o.tickFormatter(v);
        }else{
          v = t;
          label = o.tickFormatter(v);
        }
        axis.ticks[i] = { v: v, label: label };
      }
      
      for(i = 0; i < minorTicks.length; ++i){
        t = minorTicks[i];
        if(typeof(t) === 'object'){
          v = t[0];
          label = (t.length > 1) ? t[1] : o.tickFormatter(v);
        }
        else {
          v = t;
          label = o.tickFormatter(v);
        }
        axis.minorTicks[i] = { v: v, label: label };
      }
    }
    else {
      if (o.mode == 'time') {
        var tu = Flotr.Date.timeUnits,
            spec = Flotr.Date.spec,
            delta = (axis.max - axis.min) / axis.options.noTicks,
            size, unit;

        for (i = 0; i < spec.length - 1; ++i) {
          var d = spec[i][0] * tu[spec[i][1]];
          if (delta < (d + spec[i+1][0] * tu[spec[i+1][1]]) / 2 && d >= axis.tickSize)
            break;
        }
        size = spec[i][0];
        unit = spec[i][1];
        
        // special-case the possibility of several years
        if (unit == "year") {
          size = Flotr.getTickSize(axis.options.noTicks*tu.year, axis.min, axis.max, 0);
        }
        
        axis.tickSize = size;
        axis.tickUnit = unit;
        axis.ticks = Flotr.Date.generator(axis);
      }
      else if (o.scaling === 'logarithmic') {
        var max = Math.log(axis.max);
        if (o.base != Math.E) max /= Math.log(o.base);
        max = Math.ceil(max);

        var min = Math.log(axis.min);
        if (o.base != Math.E) min /= Math.log(o.base);
        min = Math.ceil(min);
        
        for (i = min; i < max; i += axis.tickSize) {
          var decadeStart = (o.base == Math.E) ? Math.exp(i) : Math.pow(o.base, i);
          // Next decade begins here:
          var decadeEnd = decadeStart * ((o.base == Math.E) ? Math.exp(axis.tickSize) : Math.pow(o.base, axis.tickSize));
          var stepSize = (decadeEnd - decadeStart) / o.minorTickFreq;
          
          axis.ticks.push({v: decadeStart, label: o.tickFormatter(decadeStart)});
          for (v = decadeStart + stepSize; v < decadeEnd; v += stepSize)
            axis.minorTicks.push({v: v, label: o.tickFormatter(v)});
        }
        
        // Always show the value at the would-be start of next decade (end of this decade)
        var decadeStart = (o.base == Math.E) ? Math.exp(i) : Math.pow(o.base, i);
        axis.ticks.push({v: decadeStart, label: o.tickFormatter(decadeStart)});
      }
      else {
        // Round to nearest multiple of tick size.
        var start = axis.tickSize * Math.ceil(axis.min / axis.tickSize),
            decimals, minorTickSize, v2;
        
        if (o.minorTickFreq)
          minorTickSize = axis.tickSize / o.minorTickFreq;
                          
        // Then store all possible ticks.
        for(i = 0; start + i * axis.tickSize <= axis.max; ++i){
          v = v2 = start + i * axis.tickSize;
          
          // Round (this is always needed to fix numerical instability).
          decimals = o.tickDecimals;
          if(decimals == null) decimals = 1 - Math.floor(Math.log(axis.tickSize) / Math.LN10);
          if(decimals < 0) decimals = 0;
          
          v = v.toFixed(decimals);
          axis.ticks.push({ v: v, label: o.tickFormatter(v) });

          if (o.minorTickFreq) {
            for(var j = 0; j < o.minorTickFreq && (i * axis.tickSize + j * minorTickSize) < axis.max; ++j) {
              v = v2 + j * minorTickSize;
              v = v.toFixed(decimals);
              axis.minorTicks.push({ v: v, label: o.tickFormatter(v) });
            }
          }
        }
      }
    }
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
  },
  /**
   * Draws grid, labels, series and outline.
   */
  draw: function(after) {
    var afterImageLoad = _.bind(function() {
      this.drawGrid();
      this.drawLabels();

      if(this.series.length){
        Flotr.EventAdapter.fire(this.el, 'flotr:beforedraw', [this.series, this]);
        
        for(var i = 0; i < this.series.length; i++){
          if (!this.series[i].hide)
            this.drawSeries(this.series[i]);
        }
      }
    
      this.drawOutline();
      Flotr.EventAdapter.fire(this.el, 'flotr:afterdraw', [this.series, this]);
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
      Flotr.EventAdapter.fire(this.el, 'flotr:beforegrid', [this.axes.x, this.axes.y, o, this]);
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
      Flotr.EventAdapter.fire(this.el, 'flotr:aftergrid', [this.axes.x, this.axes.y, o, this]);
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
   * Draws labels for x and y axis.
   */   
  drawLabels: function(){    
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
        pointer = eventPointer(e),
        rx = (pointer.x - offset.left - this.plotOffset.left),
        ry = (pointer.y - offset.top - this.plotOffset.top);

    return {
      x:  this.axes.x.p2d(rx),
      x2: this.axes.x2.p2d(rx),
      y:  this.axes.y.p2d(ry),
      y2: this.axes.y2.p2d(ry),
      relX: rx,
      relY: ry,
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
    Flotr.EventAdapter.fire(this.el, 'flotr:click', [this.getEventPosition(event), this]);
  },
  /**
   * Observes mouse movement over the graph area. Fires the 'flotr:mousemove' event.
   * @param {Event} event - 'mousemove' Event object.
   */
  mouseMoveHandler: function(event){
    var pos = this.getEventPosition(event);
    this.lastMousePos.pageX = pos.absX;
    this.lastMousePos.pageY = pos.absY;  
    Flotr.EventAdapter.fire(this.el, 'flotr:mousemove', [event, pos, this]);
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
        Flotr.EventAdapter.stopObserving(document, 'mousemove', cancelContextMenu);
      }
      Flotr.EventAdapter.observe(document, 'mousemove', cancelContextMenu);
      return;
    }
    */

    function isLeftClick (e, type) {
      return (e.which ? (e.which === 1) : (e.button === 0 || e.button === 1));
    }

    if(!this.options.selection.mode || !isLeftClick(event)) return;

    var pointer = eventPointer(event);
    this.setSelectionPos(this.selection.first, {pageX:pointer.x, pageY:pointer.y});
    if(this.selectionInterval != null){
      clearInterval(this.selectionInterval);
    }
    this.lastMousePos.pageX = null;
    this.selectionInterval = 
      setInterval(_.bind(this.updateSelection, this), 1000/this.options.selection.fps);
    
    this.mouseUpHandler = _.bind(this.mouseUpHandler, this);
    Flotr.EventAdapter.observe(document, 'mouseup', this.mouseUpHandler);
    Flotr.EventAdapter.observe(this.el, 'flotr:cleanup', _.bind(Flotr.EventAdapter.stopObserving, this, document, 'mouseup', this.mouseUpHandler));
  },
  /**
   * Fires the 'flotr:select' event when the user made a selection.
   */
  fireSelectEvent: function(){
    var a = this.axes, s = this.selection,
        x1, x2, y1, y2;
    
    x1 = a.x.p2d(s.first.x);
    x2 = a.x.p2d(s.second.x);
    y1 = a.y.p2d(s.first.y);
    y2 = a.y.p2d(s.second.y);

    Flotr.EventAdapter.fire(this.el, 'flotr:select', [{
      x1:Math.min(x1, x2), 
      y1:Math.min(y1, y2), 
      x2:Math.max(x1, x2), 
      y2:Math.max(y1, y2),
      xfirst:x1, xsecond:x2, yfirst:y1, ysecond:y2
    }, this]);
  },
  /**
   * Observes the mouseup event for the document. 
   * @param {Event} event - 'mouseup' Event object.
   */
  mouseUpHandler: function(event){
    Flotr.EventAdapter.stopObserving(document, 'mouseup', this.mouseUpHandler);
    // @TODO why?
    //event.stop();
    
    if(this.selectionInterval != null){
      clearInterval(this.selectionInterval);
      this.selectionInterval = null;
    }

    var pointer = eventPointer(event);
    this.setSelectionPos(this.selection.second, {pageX:pointer.x, pageY:pointer.y});
    this.clearSelection();
    
    if(this.selectionIsSane()){
      this.drawSelection();
      this.fireSelectEvent();
      this.ignoreClick = true;
    }
  },
  /**
   * Calculates the position of the selection.
   * @param {Object} pos - Position object.
   * @param {Event} event - Event object.
   */
  setSelectionPos: function(pos, pointer) {
    var options = this.options,
        offset = D.position(this.overlay);

    if(options.selection.mode.indexOf('x') == -1){
      pos.x = (pos == this.selection.first) ? 0 : this.plotWidth;         
    }else{
      pos.x = pointer.pageX - offset.left - this.plotOffset.left;
      pos.x = Math.min(Math.max(0, pos.x), this.plotWidth);
    }

    if (options.selection.mode.indexOf('y') == -1){
      pos.y = (pos == this.selection.first) ? 0 : this.plotHeight;
    }else{
      pos.y = pointer.pageY - offset.top - this.plotOffset.top;
      pos.y = Math.min(Math.max(0, pos.y), this.plotHeight);
    }
  },
  /**
   * Updates (draws) the selection box.
   */
  updateSelection: function(){
    if(this.lastMousePos.pageX == null) return;
    
    this.setSelectionPos(this.selection.second, this.lastMousePos);
    this.clearSelection();
    
    if(this.selectionIsSane()) this.drawSelection();
  },
  /**
   * Removes the selection box from the overlay canvas.
   */
  clearSelection: function() {
    if(this.prevSelection == null) return;
      
    var prevSelection = this.prevSelection,
      lw = this.octx.lineWidth,
      plotOffset = this.plotOffset,
      x = Math.min(prevSelection.first.x, prevSelection.second.x),
      y = Math.min(prevSelection.first.y, prevSelection.second.y),
      w = Math.abs(prevSelection.second.x - prevSelection.first.x),
      h = Math.abs(prevSelection.second.y - prevSelection.first.y);
    
    this.octx.clearRect(x + plotOffset.left - lw/2+0.5,
                        y + plotOffset.top - lw/2+0.5,
                        w + lw,
                        h + lw);
    
    this.prevSelection = null;
  },
  /**
   * Allows the user the manually select an area.
   * @param {Object} area - Object with coordinates to select.
   */
  setSelection: function(area, preventEvent){
    var options = this.options,
      xa = this.axes.x,
      ya = this.axes.y,
      vertScale = ya.scale,
      hozScale = xa.scale,
      selX = options.selection.mode.indexOf('x') != -1,
      selY = options.selection.mode.indexOf('y') != -1;
    
    this.clearSelection();

    this.selection.first.y  = (selX && !selY) ? 0 : (ya.max - area.y1) * vertScale;
    this.selection.second.y = (selX && !selY) ? this.plotHeight : (ya.max - area.y2) * vertScale;      
    this.selection.first.x  = (selY && !selX) ? 0 : (area.x1 - xa.min) * hozScale;
    this.selection.second.x = (selY && !selX) ? this.plotWidth : (area.x2 - xa.min) * hozScale;
    
    this.drawSelection();
    if (!preventEvent)
      this.fireSelectEvent();
  },
  /**
   * Draws the selection box.
   */
  drawSelection: function() {
    var prevSelection = this.prevSelection,
      s = this.selection,
      octx = this.octx,
      options = this.options,
      plotOffset = this.plotOffset;
    
    if(prevSelection != null &&
      s.first.x == prevSelection.first.x &&
      s.first.y == prevSelection.first.y && 
      s.second.x == prevSelection.second.x &&
      s.second.y == prevSelection.second.y)
      return;

    octx.save();
    octx.strokeStyle = this.processColor(options.selection.color, {opacity: 0.8});
    octx.lineWidth = 1;
    octx.lineJoin = 'miter';
    octx.fillStyle = this.processColor(options.selection.color, {opacity: 0.4});

    this.prevSelection = {
      first: { x: s.first.x, y: s.first.y },
      second: { x: s.second.x, y: s.second.y }
    };

    var x = Math.min(s.first.x, s.second.x),
        y = Math.min(s.first.y, s.second.y),
        w = Math.abs(s.second.x - s.first.x),
        h = Math.abs(s.second.y - s.first.y);
    
    octx.fillRect(x + plotOffset.left+0.5, y + plotOffset.top+0.5, w, h);
    octx.strokeRect(x + plotOffset.left+0.5, y + plotOffset.top+0.5, w, h);
    octx.restore();
  },
  /**
   * Determines whether or not the selection is sane and should be drawn.
   * @return {Boolean} - True when sane, false otherwise.
   */
  selectionIsSane: function(){
    return Math.abs(this.selection.second.x - this.selection.first.x) >= 5 &&
           Math.abs(this.selection.second.y - this.selection.first.y) >= 5;
  },
  getMouseTrack: function() {
    if (!this.mouseTrack) {
      this.mouseTrack = D.node('<div class="flotr-mouse-value"></div>');
      D.insert(this.el, this.mouseTrack);
    }
    return this.mouseTrack;
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
    this.selection = {first: {x: -1, y: -1}, second: {x: -1, y: -1}};
    this.prevSelection = null;
    this.selectionInterval = null;
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
  _setEl: function(el) {
    if (!el) throw 'The target container doesn\'t exist';
    if (!el.clientWidth) throw 'The target container must be visible';
    this.el = el;
    this.el.graph = this;
  }
}
})();
