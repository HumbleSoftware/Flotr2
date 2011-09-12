(function () {

Flotr.ExampleList.add({
  key : 'mouse-tracking',
  name : 'Mouse Tracking',
  callback : mouse_tracking
});

function mouse_tracking (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    graph, i;

  for (i = 0; i < 20; i += 0.5) {
    d1.push([i, 2*i]);
    d2.push([i, i*1.5+1.5*Math.sin(i)]);
    d3.push([i, 3*Math.cos(i)+10]);
  }

  graph = Flotr.draw(
    container, 
    [
      {
        data : d1,
        mouse : { track : false } // Disable mouse tracking for d1
      },
      d2,
      d3
    ],
    {
      mouse : {
        track           : true, // Enable mouse tracking
        lineColor       : 'purple',
        relative        : true,
        position        : 'ne',
        sensibility     : 1,
        trackDecimals   : 2,
        trackFormatter  : function (o) { return 'x = ' + o.x +', y = ' + o.y; }
      },
      crosshair : {
        mode : 'xy'
      }
    }
  );

};      

})();
