/**
 * Flotr Series Library
 */

(function () {

function Axis (o) {
  _.extend(this, o);
};

Axis.prototype = {
};

_.extend(Axis, {
  getAxes : function (options) {
    return {
      x:  {options: options.xaxis,  n: 1}, 
      x2: {options: options.x2axis, n: 2}, 
      y:  {options: options.yaxis,  n: 1}, 
      y2: {options: options.y2axis, n: 2}
    };
  }
});

Flotr.Axis = Axis;

})();

