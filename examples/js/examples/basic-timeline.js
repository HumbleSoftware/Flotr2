(function () {

Flotr.ExampleList.add({
  key : 'basic-timeline',
  name : 'Basic Timeline',
  callback : basic_timeline
});

function basic_timeline (container) {

  var
    d1        = [[1, 4, 5]],
    d2        = [[3.2, 3, 4]],
    d3        = [[1.9, 2, 2], [5, 2, 3.3]],
    d4        = [[1.55, 1, 9]],
    d5        = [[5, 0, 2.3]],
    data      = [],
    timeline  = { show : true, barWidth : .5 },
    markers   = [],
    labels    = ['Obama', 'Bush', 'Clinton', 'Palin', 'McCain'],
    i, graph, point;

  // Timeline
  Flotr._.each([d1, d2, d3, d4, d5], function (d) {
    data.push({
      data : d,
      timeline : Flotr._.clone(timeline)
    });
  });

  // Markers
  Flotr._.each([d1, d2, d3, d4, d5], function (d) {
    point = d[0];
    markers.push([point[0], point[1]]);
  });
  data.push({
    data: markers,
    markers: {
      show: true,
      position: 'rm',
      fontSize: 11,
      labelFormatter : function (o) { return labels[o.index]; }
    }
  });
  
  // Draw Graph
  graph = Flotr.draw(container, data, {
    xaxis: {
      noTicks: 3,
      tickFormatter: function (x) {
        var
          x = parseInt(x),
          months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[(x-1)%12];
      }
    }, 
    yaxis: {
      showLabels : false
    },
    grid: {
      horizontalLines : false
    }
  });
}

})();
