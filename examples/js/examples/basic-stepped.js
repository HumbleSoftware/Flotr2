(function () {

Flotr.ExampleList.add({
  key : 'basic-stepped',
  name : 'Basic Stepped',
  callback : basic_stepped,
  type : 'test'
});

function basic_stepped (container) {

  var
    d1 = [[0, 3], [4, 8], [8, 5], [9, 13]], // First data series
    d2 = [],                                // Second data series
    i, graph;

  // Generate first data set
  for (i = 0; i < 14; i += 0.5) {
    d2.push([i, Math.sin(i)]);
  }

  // Draw Graph
  graph = Flotr.draw(container, [ d1, d2 ], {
    lines: {
      steps : true,
      show : true
    },
    xaxis: {
      minorTickFreq: 4
    }, 
    yaxis: {
      autoscale: true
    },
    grid: {
      minorVerticalLines: true
    },
    mouse : {
      track : true,
      relative : true
    }
  });
}

})();
