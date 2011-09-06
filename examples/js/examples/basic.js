(function () {

Flotr.ExampleList.add({
  key : 'basic',
  name : 'Basic',
  callback : basic
});

function basic (container) {

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
    xaxis: {
      minorTickFreq: 4
    }, 
    grid: {
      minorVerticalLines: true
    }
  });
}

})();
