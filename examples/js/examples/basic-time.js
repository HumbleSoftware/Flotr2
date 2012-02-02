(function () {

Flotr.ExampleList.add({
  key : 'basic-time',
  name : 'Basic Time',
  callback : basic_time,
  description : "<p>Select an area of the graph to zoom.  Click to reset the chart.</p>"
});

function basic_time (container) {

  var
    d1    = [],
    start = new Date("2009/01/01 01:00").getTime(),
    options,
    graph,
    i, x, o;

  for (i = 0; i < 100; i++) {
    x = start+(i*1000*3600*24*36.5);
    d1.push([x, i+Math.random()*30+Math.sin(i/20+Math.random()*2)*20+Math.sin(i/10+Math.random())*10]);
  }
        
  options = {
    xaxis : {
      mode : 'time', 
      labelsAngle : 45
    },
    selection : {
      mode : 'x'
    },
    HtmlText : false,
    title : 'Time'
  };
        
  // Draw graph with default options, overwriting with passed options
  function drawGraph (opts) {

    // Clone the options, so the 'options' variable always keeps intact.
    o = Flotr._.extend(Flotr._.clone(options), opts || {});

    // Return a new graph.
    return Flotr.draw(
      container,
      [ d1 ],
      o
    );
  }

  graph = drawGraph();      
        
  Flotr.EventAdapter.observe(container, 'flotr:select', function(area){
    // Draw selected area
    graph = drawGraph({
      xaxis : { min : area.x1, max : area.x2, mode : 'time', labelsAngle : 45 },
      yaxis : { min : area.y1, max : area.y2 }
    });
  });
        
  // When graph is clicked, draw the graph with default area.
  Flotr.EventAdapter.observe(container, 'flotr:click', function () { graph = drawGraph(); });
};      

})();
