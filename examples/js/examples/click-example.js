(function () {

Flotr.ExampleList.add({
  key : 'click-example',
  name : 'Click Example',
  callback : click_example
});

function click_example (container) {

  var
    d1 = [[0,0]], // Point at origin
    options,
    graph;

  options = {
    xaxis: {min: 0, max: 15},
    yaxis: {min: 0, max: 15},
    lines: {show: true},
    points: {show: true},
    mouse: {track:true},
    title: 'Click Example'
  };

  graph = Flotr.draw(container, [d1], options);

  // Add a point to the series and redraw the graph
  Flotr.EventAdapter.observe(container, 'flotr:click', function(position){

    // Add a point to the series at the location of the click
    d1.push([position.x, position.y]);
    
    // Sort the series.
    d1 = d1.sort(function (a, b) { return a[0] - b[0]; });
    
    // Redraw the graph, with the new series.
    graph = Flotr.draw(container, [d1], options);
  });
};      

})();
