(function () {

Flotr.ExampleList.add({
  key : 'download-image',
  name : 'Download Image',
  callback : download_image,
  description : '' + 
    '<form name="image-download" action="" onsubmit="return false">' +
      '<label><input type="radio" name="format" value="png" checked="checked" /> PNG</label>' +
      '<label><input type="radio" name="format" value="jpeg" /> JPEG</label>' +
      '<label><input type="radio" name="format" value="bmp" /> BMP</label>' +

      '<button name="to-image" onclick="Examples.current.saveImage(this.form.format.value, null, null, true)">To Image</button>' +
      '<button name="download" onclick="Examples.current.saveImage(this.form.format.value)">Download</button>' +
      '<button name="reset" onclick="Examples.current.restoreCanvas()">Reset</button>' +
    '</form>'
});

function download_image (container) {

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

  // Draw the graph
  graph = Flotr.draw(
    container,[ 
      {data:d1, label:'y = 4 + x^(1.5)', lines:{fill:true}}, 
      {data:d2, label:'y = x^3', yaxis:2}, 
      {data:d3, label:'y = 5x + 3sin(4x)'}, 
      {data:d4, label:'y = x'},
      {data:d5, label:'y = 2x', lines: {show: true}, points: {show: true}}
    ],{
      title: 'Download Image Example',
      subtitle: 'You can save me as an image',
      xaxis:{
        noTicks: 7, // Display 7 ticks.
        tickFormatter: function(n){ return '('+n+')'; }, // => displays tick values between brackets.
        min: 1,  // => part of the series is not displayed.
        max: 7.5, // => part of the series is not displayed.
        labelsAngle: 45,
        title: 'x Axis'
      },
      yaxis:{
        ticks: [[0, "Lower"], 10, 20, 30, [40, "Upper"]],
        max: 40,
        title: 'y = f(x)'
      },
      y2axis:{color:'#FF0000', max: 500, title: 'y = x^3'},
      grid:{
        verticalLines: false,
        backgroundColor: 'white'
      },
      HtmlText: false,
      legend: {
        position: 'nw'
      }
  });
  
  if (Flotr.isIE && Flotr.isIE < 9) {
    alert(
      "Your browser doesn't allow you to get a bitmap image from the plot, " +
      "you can only get a VML image that you can use in Microsoft Office.<br />"
    );
  }

  return graph;
};

})();
