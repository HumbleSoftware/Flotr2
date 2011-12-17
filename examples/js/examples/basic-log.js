(function () {

Flotr.ExampleList.add({
  key : 'basic-log',
  name : 'Basic Log',
  callback : basic
});

function basic (container) {

  var
    d1 = [], // Second data series
    i, graph;

  // Generate first data set
  for (i = 0; i < 14; i += 0.5) {
    d1.push([i, Math.exp(i)]);
  }

  // Draw Graph
  graph = Flotr.draw(container, [ d1 ], {
    xaxis: {
      minorTickFreq: 4
    },
    yaxis : {
      scaling: 'logarithmic'
    },
    grid: {
      minorVerticalLines: true
    }
  });
}

})();
