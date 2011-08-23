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
      x:  new Axis({options: options.xaxis,  n: 1}),
      x2: new Axis({options: options.x2axis, n: 2}),
      y:  new Axis({options: options.yaxis,  n: 1}),
      y2: new Axis({options: options.y2axis, n: 2})
    };
  }
});

Flotr.Axis = Axis;

})();

