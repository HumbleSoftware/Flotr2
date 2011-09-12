(function () {

Flotr.ExampleList.add({
  key : 'download-data',
  name : 'Download Data',
  callback : download_data
});

function download_data (container) {

  var
    d1 = [],
    d2 = [],
    d3 = [],
    d4 = [],
    d5 = [],
    graph,
    i;
  
  for (i = 0; i <= 10; i += 0.1) {
    d1.push([i, 4 + Math.pow(i,1.5)]);
    d2.push([i, Math.pow(i,3)]);
    d3.push([i, i*5+3*Math.sin(i*4)]);
    d4.push([i, i]);
    if( i.toFixed(1)%1 == 0 ){
      d5.push([i, 2*i]);
    }
  }
          
  // Draw the graph.
  graph = Flotr.draw(
    container, [ 
      { data : d1, label : 'y = 4 + x^(1.5)', lines : { fill : true } },
      { data : d2, label : 'y = x^3' },
      { data : d3, label : 'y = 5x + 3sin(4x)' },
      { data : d4, label : 'y = x' },
      { data : d5, label : 'y = 2x', lines : { show : true }, points : { show : true } }
    ],{
      xaxis : {
        noTicks : 7,
        tickFormatter : function (n) { return '('+n+')'; },
        min: 1,   // Part of the series is not displayed.
        max: 7.5
      },
      yaxis : {
        ticks : [[ 0, "Lower"], 10, 20, 30, [40, "Upper"]],
        max : 40
      },
      grid : {
        verticalLines : false,
        backgroundColor : 'white'
      },
      legend : {
        position : 'nw'
      },
      spreadsheet : {
        show : true,
        tickFormatter : function (e) { return e+''; }
      }
  });
};

})();
