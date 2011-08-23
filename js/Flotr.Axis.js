/**
 * Flotr Series Library
 */

(function () {

var LOGARITHMIC = 'logarithmic';

function Axis (o) {

  this.orientation = 1;
  this.offset = 0;

  _.extend(this, o);

  this._setTranslations();
};


// Prototype
Axis.prototype = {

  setScale : function () {
    var length = this.length;
    if (this.options.scaling == LOGARITHMIC) {
      this.scale = length / (log(this.max, this.options.base) - log(this.min, this.options.base));
    } else {
      this.scale = length / (this.max - this.min);
    }
  },

  _setTranslations : function (logarithmic) {
    this.d2p = (logarithmic ? d2pLog : d2p);
    this.p2d = (logarithmic ? p2dLog : p2d);
  },

  calculateTicks : function () {
    var axis = this,
      o = axis.options,
      i, v;

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
  }

};


// Static Methods
_.extend(Axis, {
  getAxes : function (options) {
    return {
      x:  new Axis({options: options.xaxis,  n: 1, length: this.plotWidth}),
      x2: new Axis({options: options.x2axis, n: 2, length: this.plotWidth}),
      y:  new Axis({options: options.yaxis,  n: 1, length: this.plotHeight, offset: this.plotHeight, orientation: -1}),
      y2: new Axis({options: options.y2axis, n: 2, length: this.plotHeight, offset: this.plotHeight, orientation: -1})
    };
  }
});


// Helper Methods

function d2p (dataValue) {
  return this.offset + this.orientation * (dataValue - this.min) * this.scale;
}

function p2d (pointValue) {
  return (this.offset + this.orientation * pointValue) / this.scale + this.min;
}

function d2pLog (dataValue) {
  return this.offset + this.orientation * (log(dataValue, this.options.base) - log(this.min, this.options.base)) * this.scale;
}

function p2dLog (pointValue) {
  return exp((this.offset + this.orientation * pointValue) / this.scale + log(this.min, this.options.base), this.options.base);
}

function log (value, base) {
  value = Math.log(Math.max(value, Number.MIN_VALUE));
  if (base !== Math.E) 
    value /= Math.log(o.base);
  return value;
}

function exp (value, base) {
  return (base === Math.E) ? Math.exp(value) : Math.pow(base, value);
}

Flotr.Axis = Axis;

})();
