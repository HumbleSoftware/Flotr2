(function () {

var ExampleList = [];

ExampleList.push({
  key : 'basic',
  name : 'Basic',
  callback : function (container) {

    var
      d1 = [[0, 3], [4, 8], [8, 5], [9, 13]], // First dataset
      d2 = [],                                // Second dataset
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
});

Flotr.ExampleList =  ExampleList;

})();
