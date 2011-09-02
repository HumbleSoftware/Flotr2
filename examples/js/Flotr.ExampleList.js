(function () {

var ExampleList = [];

ExampleList.push({
  key : 'basic',
  name : 'Basic',
  callback : basic
});

ExampleList.push({
  key : 'basic-axi',
  name : 'Basic Axis',
  callback : basic_axis
});

ExampleList.push({
  key : 'basic-bar',
  name : 'Basic Bars',
  callback : basic_bars
});

ExampleList.push({
  key : 'basic-bar-horizontal',
  name : 'Horizontal Bars',
  args : [true],
  callback : basic_bars
});

ExampleList.push({
  key : 'basic-bar-stacked',
  name : 'Stacked Bars',
  callback : bars_stacked
});

ExampleList.push({
  key : 'basic-pie',
  name : 'Basic Pie',
  callback : basic_pie
});

ExampleList.push({
  key : 'basic-radar',
  name : 'Basic Radar',
  callback : basic_radar
});

ExampleList.push({
  key : 'basic-bubble',
  name : 'Basic Bubble',
  callback : basic_bubble
});

ExampleList.push({
  key : 'basic-candle',
  name : 'Basic Candle',
  callback : basic_candle
});

function basic (container) {

  var
    d1 = [[0, 3], [4, 8], [8, 5], [9, 13]], // First data series
    d2 = [],                                // Second data series
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

function basic_axis (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    d4 = [],
    d5 = [],                        // Data
    ticks = [[ 0, "Lower"], 10, 20, 30, [40, "Upper"]], // Ticks for the Y-Axis
    graph;
        
  for(var i = 0; i <= 10; i += 0.1){
    d1.push([i, 4 + Math.pow(i,1.5)]);
    d2.push([i, Math.pow(i,3)]);
    d3.push([i, i*5+3*Math.sin(i*4)]);
    d4.push([i, i]);
    if( i.toFixed(1)%1 == 0 ){
      d5.push([i, 2*i]);
    }
  }
        
  d3[30][1] = null;
  d3[31][1] = null;

  function ticksFn (n) { return '('+n+')'; }

  graph = Flotr.draw(container, [ 
      { data : d1, label : 'y = 4 + x^(1.5)', lines : { fill : true } }, 
      { data : d2, label : 'y = x^3'}, 
      { data : d3, label : 'y = 5x + 3sin(4x)'}, 
      { data : d4, label : 'y = x'},
      { data : d5, label : 'y = 2x', lines : { show : true }, points : { show : true } }
    ], {
      xaxis : {
        noTicks : 7,              // Display 7 ticks.
        tickFormatter : ticksFn,  // Displays tick values between brackets.
        min : 1,                  // Part of the series is not displayed.
        max : 7.5                 // Part of the series is not displayed.
      },
      yaxis : {
        ticks : ticks,            // Set Y-Axis ticks
        max : 40                  // Maximum value along Y-Axis
      },
      grid : {
        verticalLines : false,
        backgroundColor : {
          colors : [[0,'#fff'], [1,'#ccc']],
          start : 'top',
          end : 'bottom'
        }
      },
      legend : {
        position : 'nw'
      },
      title : 'Basic Axis example',
      subtitle : 'This is a subtitle'
  });
}

function bars_stacked (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    graph, i;

  for (i = -10; i < 10; i++) {
    /*
    if (horizontal) {
      d1.push([Math.random(), i]);
      d2.push([Math.random(), i]);
      d3.push([Math.random(), i]);
    } else {
    */
      d1.push([i, Math.random()]);
      d2.push([i, Math.random()]);
      d3.push([i, Math.random()]);
      /*
    }
    */
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
     // horizontal : horizontal,
      barWidth : 0.6
    },
    grid : {
      verticalLines : false
    }
    //spreadsheet : { show : true }
  });
}

function basic_pie (container) {

  var
    d1 = [[0, 4]],
    d2 = [[0, 3]],
    d3 = [[0, 1.03]],
    d4 = [[0, 3.5]],
    graph;
  
  graph = Flotr.draw(container, [
    { data : d1, label : 'Comedy' },
    { data : d2, label : 'Action' },
    { data : d3, label : 'Romance',
      pie : {
        explode : 50
      }
    },
    { data : d4, label : 'Drama' }
  ], {
    HtmlText : false,
    grid : {
      verticalLines : false,
      horizontalLines : false
    },
    xaxis : { showLabels : false },
    yaxis : { showLabels : false },
    pie : {
      show : true, 
      explode : 6
    },
    mouse : { track : true },
    legend : {
      position : 'se',
      backgroundColor : '#D2E8FF'
    }
  });
}

function basic_radar (container) {

  // Fill series s1 and s2.
  var
    s1 = { label : 'Actual', data : [[0, 3], [1, 8], [2, 5], [3, 5], [4, 3], [5, 9]] },
    s2 = { label : 'Target', data : [[0, 8], [1, 7], [2, 8], [3, 2], [4, 4], [5, 7]] },
    graph, ticks;

  // Radar Labels
  ticks = [
    [0, "Statutory"],
    [1, "External"],
    [2, "Videos"],
    [3, "Yippy"],
    [4, "Management"],
    [5, "oops"]
  ];
    
  // Draw the graph.
  graph = Flotr.draw(container, [ s1, s2 ], {
    radar : { show : true}, 
    grid  : { circular : true, minorHorizontalLines : true}, 
    yaxis : { min : 0, max : 10, minorTickFreq : 2}, 
    xaxis : { ticks : ticks}
  });
}

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

function basic_candle (container) {

  var
    d1 = [],
    price = 3.206,
    graph,
    i, a, b, c;

  for (i = 0; i < 50; i++) {
      a = Math.random();
      b = Math.random();
      c = (Math.random() * (a + b)) - b;
      d1.push([i, price, price + a, price - b, price + c]);
      price = price + c;
  }
    
  // Graph
  graph = Flotr.draw(container, [ d1 ], { 
    candles : { show : true, candleWidth : 0.6 },
    xaxis   : { noTicks : 10 }
  });
}

function basic_legend (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    data,
    graph, i;

  // Data Generation
  for (i = 0; i < 15; i += 0.5) {
    d1.push([i, i + Math.sin(i+Math.PI)]);
    d2.push([i, i]);
    d3.push([i, 15-Math.cos(i)]);
  }

  data = [
    { data : d1, label :'x + sin(x+&pi;)' },
    { data : d2, label :'x' },
    { data : d3, label :'15 - cos(x)' }
  ];


  // This function prepend each label with 'y = '
  function labelFn (label) {
    return 'y = ' + label;
  }

  // Draw graph
  graph = Flotr.draw(container, data, {
    legend : {
      position : 'se',            // Position the legend 'south-east'.
      labelFormatter : labelFn,   // Format the labels.
      backgroundColor : '#D2E8FF' // A light blue background color.
    },
    HtmlText : false
  });
}

Flotr.ExampleList =  ExampleList;

})();
