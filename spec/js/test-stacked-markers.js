(function () {

Flotr.ExampleList.add({
  key : 'test-stacked-markers',
  name : 'Test Stacked Markers',
  callback : test,
  timeout : 100, 
  tolerance : 10
});

function test (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    graph, i;

  for (i = 0; i < 10; i++) {
    d1.push([i, Math.random()]);
    d2.push([i, Math.random()]);
    d3.push([i, Math.random()]);
  }

  graph = Flotr.draw(container,[
    { data : d1, label : 'Serie 1' },
    { data : d2, label : 'Serie 2' },
    { data : d3, label : 'Serie 3' }
  ], {
    legend : {
      backgroundColor : '#D2E8FF' // Light blue 
    },
    bars : {
      show : true,
      stacked : true,
      barWidth : 0.6,
      lineWidth : 1,
      shadowSize : 0,
      stacked : true
    },
    markers : {
      show : true,
      stacked : true
    }
  });
}

})();
