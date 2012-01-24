(function () {

Flotr.ExampleList.add({
  key : 'basic-stacked',
  name : 'Basic Stacked',
  callback : basic_stacked,
  type : 'test'
});

function basic_stacked (container) {

  var
    d1 = [[0, 3], [4, 8], [8, 2], [9, 3]], // First data series
    d2 = [[0, 2], [4, 3], [8, 8], [9, 4]], // Second data series
    i, graph;

  // Draw Graph
  graph = Flotr.draw(container, [ d1, d2 ], {
    lines: {
      show : true,
      stacked: true
    },
    xaxis: {
      minorTickFreq: 4
    }, 
    grid: {
      minorVerticalLines: true
    }
  });
}

})();
