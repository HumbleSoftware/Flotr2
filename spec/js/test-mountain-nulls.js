(function () {

Flotr.ExampleList.add({
  key : 'test-mountain-nulls',
  name : 'Mountain Nulls',
  callback : function (container) {
    var
      d1 = [[0, 3], [4, 8], [5, 6], [6, null], [7, 7], [8, 0], [9, null], [10, 5], [11, 0]], // First data series
      d2 = [],                                // Second data series
      i, graph;

    // Generate first data set
    for (i = 0; i < 14; i += 0.5) {
      d2.push([i, Math.sin(i)]);
    }
    
    // Multiple nulls
    d2[9][1] = null;
    d2[10][1] = null;
    d2[11][1] = null;
    
    // Single not null surrounded by null
    d2[13][1] = null;
    
    // < 0 null
    d2[23][1] = null;

    // Draw Graph
    graph = Flotr.draw(container, [ d1, d2 ], {
      xaxis: {
        minorTickFreq: 4
      },
      lines: {
        fill : true
      },
      grid: {
        minorVerticalLines: true
      }
    });
  },
  type : 'test'
});

})();
