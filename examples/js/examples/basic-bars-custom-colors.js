(function () {

Flotr.ExampleList.add({
  key : 'basic-bars-custom-colors',
  name : 'Basic Bars with Custom Colors',
  callback : basic_bars_custom_colors
});

function basic_bars_custom_colors (container) {

  var
    d1 = [[0, 8], [1, 6], [2, 4], [3, 7]],       // Series 1
    d2 = [[0.1, 5], [1.1, 9], [2.1, 3], [3.1, 8]],   // Series 2
    d3 = [[0.2, 7], [1.2, 4], [2.2, 6], [3.2, 5]],   // Series 3
    d4 = [[0.3, 3], [1.3, 8], [2.3, 9], [3.3, 4]],   // Series 4
    d5 = [[0.4, 6], [1.4, 7], [2.4, 5], [3.4, 9]],   // Series 5
    d6 = [[0.5, 9], [1.5, 3], [2.5, 8], [3.5, 6]],   // Series 6
    d7 = [[0.6, 4], [1.6, 5], [2.6, 7], [3.6, 3]],   // Series 7
    d8 = [[0.7, 8], [1.7, 6], [2.7, 4], [3.7, 7]];   // Series 8
              
  // Draw the graph with custom colors from issue #322
  Flotr.draw(
    container,
    [d1, d2, d3, d4, d5, d6, d7, {data: d8, color: '#0000FF'}],
    {
      colors: ["#89AFD2","#1D1D1D","#DF021D","#0E204B","#D67840","#0E204B","#D67840"],
      bars : {
        show : true,
        horizontal : false,
        shadowSize : 0,
        barWidth : 0.1
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