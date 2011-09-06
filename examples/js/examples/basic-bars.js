(function () {

Flotr.ExampleList.add({
  key : 'basic-bars',
  name : 'Basic Bars',
  callback : basic_bars
});

Flotr.ExampleList.add({
  key : 'basic-bars-horizontal',
  name : 'Horizontal Bars',
  args : [true],
  callback : basic_bars
});

function basic_bars (container, horizontal) {

  var
    horizontal = (horizontal ? true : false), // Show horizontal bars
    d1 = [],                                  // First data series
    d2 = [],                                  // Second data series
    markers,                                  // Marker data set
    point,                                    // Data point variable declaration
    i;

  markers = {
    data : [],
    markers : {
      show : true,
      position : 'ct',
      labelFormatter : function markerFomatter(obj) {
        return obj.y+'%';
      }
    },
    bars : {
      show : false
    }
  };
          
  for (i = 0; i < 4; i++) {

    if (horizontal) { 
      point = [Math.ceil(Math.random()*10), i];
    } else {
      point = [i, Math.ceil(Math.random()*10)];
    }

    d1.push(point);
    markers.data.push(point);
        
    if (horizontal) { 
      point = [Math.ceil(Math.random()*10), i+0.5];
    } else {
      point = [i+0.5, Math.ceil(Math.random()*10)];
    }

    d2.push(point);
    markers.data.push(point);
  };
              
  // Draw the graph
  Flotr.draw(
    container,
    [d1, d2, markers],
    {
      bars : {
        show : true,
        horizontal : horizontal,
        barWidth : 0.5
      },
      mouse : {
        track : true,
        relative : true
      },
      yaxis : {
        min : 0,
        autoscaleMargin : 1
      }
    }
  );
}

})();
