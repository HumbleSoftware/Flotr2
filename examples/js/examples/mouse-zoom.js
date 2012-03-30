(function () {

Flotr.ExampleList.add({
  key : 'mouse-zoom',
  name : 'Mouse Zoom',
  callback : mouse_zoom,
  description : "<p>Select an area of the graph to zoom.  Click to reset the chart.</p>"
});

function mouse_zoom (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    options,
    graph,
    i;

  for (i = 0; i < 40; i += 0.5) {
    d1.push([i, Math.sin(i)+3*Math.cos(i)]);
    d2.push([i, Math.pow(1.1, i)]);
    d3.push([i, 40 - i+Math.random()*10]);
  }
      
  options = {
    selection : { mode : 'x', fps : 30 },
    title : 'Mouse Zoom'
  };
    
  // Draw graph with default options, overwriting with passed options
  function drawGraph (opts) {

    // Clone the options, so the 'options' variable always keeps intact.
    var o = Flotr._.extend(Flotr._.clone(options), opts || {});

    // Return a new graph.
    return Flotr.draw(
      container,
      [ d1, d2, d3 ],
      o
    );
  }

  // Actually draw the graph.
  graph = drawGraph();      
    
  // Hook into the 'flotr:select' event.
  Flotr.EventAdapter.observe(container, 'flotr:select', function (area) {

    // Draw graph with new area
    graph = drawGraph({
      xaxis: {min:area.x1, max:area.x2},
      yaxis: {min:area.y1, max:area.y2}
    });
  });
    
  // When graph is clicked, draw the graph with default area.
  Flotr.EventAdapter.observe(container, 'flotr:click', function () { drawGraph(); });
};

})();

