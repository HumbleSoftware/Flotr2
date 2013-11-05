(function () {

Flotr.ExampleList.add({
  key : 'mouse-drag',
  name : 'Mouse Drag',
  callback : mouse_drag
});

function mouse_drag (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    options,
    graph,
    start,
    i;

  for (i = -40; i < 40; i += 0.5) {
    d1.push([i, Math.sin(i)+3*Math.cos(i)]);
    d2.push([i, Math.pow(1.1, i)]);
    d3.push([i, 40 - i+Math.random()*10]);
  }
      
  options = {
    xaxis: {min: 0, max: 20},
      title : 'Mouse Drag'
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

  graph = drawGraph();      

  function initializeDrag (e) {
    start = graph.getEventPosition(e);
    Flotr.EventAdapter.observe(container, 'flotr:mousemove', move);
    Flotr.EventAdapter.observe(container, 'flotr:mouseup', stopDrag);
  }

  function move (e, o) {
    var
      xaxis   = graph.axes.x,
      offset  = start.x - o.x;
    graph = drawGraph({
      xaxis : {
        min : xaxis.min + offset,
        max : xaxis.max + offset
      }
    });
  }

  function stopDrag () {
    Flotr.EventAdapter.stopObserving(container, 'flotr:mousemove', move);
  }

  Flotr.EventAdapter.observe(container, 'flotr:mousedown', initializeDrag);

};

})();
