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
