/**
 * Flotr Series Library
 */

(function () {

function Series () {

};

Series.prototype = {

}

_.extend(Series, {
  /**
   * Collects dataseries from input and parses the series into the right format. It returns an Array 
   * of Objects each having at least the 'data' key set.
   * @param {Array, Object} data - Object or array of dataseries
   * @return {Array} Array of Objects parsed into the right format ({(...,) data: [[x1,y1], [x2,y2], ...] (, ...)})
   */
  getSeries: function(data){
    return _.map(data, function(serie){
      return (serie.data ? serie : {data: serie});
    });
  }
});

Flotr.Series = Series;

})();
