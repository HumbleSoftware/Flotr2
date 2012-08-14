(function () {

Flotr.ExampleList.add({
  key : 'half-pie',
  name : 'Half Pie',
  callback : half_pie
});

function half_pie (container) {

  var
    d1 = [[0, 4]],
    d2 = [[0, 3]],
    d3 = [[0, 1.03]],
    d4 = [[0, 3.5]],
    graph;
  
  graph = Flotr.draw(container, [
    { data : d1, label : 'Republican' },
    { data : d2, label : 'Democratic' },
    { data : d3, label : 'Green'},
    { data : d4, label : 'Pirates' }
  ], {
    HtmlText : true,
    grid : {
      verticalLines : false,
      horizontalLines : false
    },
    xaxis : { showLabels : false },
    yaxis : { showLabels : false },
    pie : {
      show : true, 
      explode : 6,
      startAngle: 0.5,
      labelFormatter: function(){
      },
      halfPie: true
    },
    mouse : { track : true },
    legend : {
      position : 'se',
      backgroundColor : '#D2E8FF'
    }
  });
}

})();
