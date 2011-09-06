(function () {

Flotr.ExampleList.add({
  key : 'basic-bubble',
  name : 'Basic Bubble',
  callback : basic_bubble
});

function basic_bubble (container) {

  var
    d1 = [],
    d2 = [],
    point, graph, i;
      
  for (i = 0; i < 10; i++ ){
    point = [i, Math.ceil(Math.random()*10), Math.ceil(Math.random()*10)];
    d1.push(point);
    
    point = [i, Math.ceil(Math.random()*10), Math.ceil(Math.random()*10)];
    d2.push(point);
  }
  
  // Draw the graph
  graph = Flotr.draw(container, [d1, d2], {
    bubbles : { show : true, baseRadius : 5 },
    xaxis   : { min : -4, max : 14 },
    yaxis   : { min : -4, max : 14 }
  });
}

})();
