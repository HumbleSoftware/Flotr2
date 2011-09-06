(function () {

Flotr.ExampleList.add({
  key : 'color-gradients',
  name : 'Color Gradients',
  callback : color_gradients
});

function color_gradients (container) {

  var
    bars = {
      data: [],
      bars: {
        show: true,
        barWidth: 0.8,
        lineWidth: 0,
        fillColor: {
          colors: ['#CB4B4B', '#fff'],
          start: 'top',
          end: 'bottom'
        },
        fillOpacity: 0.8
      }
    }, markers = {
      data: [],
      markers: {
        show: true,
        position: 'ct'
      }
    }, lines = {
      data: [],
      lines: {
        show: true,
        fillColor: ['#00A8F0', '#fff'],
        fill: true,
        fillOpacity: 1
      }
    },
    point,
    graph,
    i;
  
  for (i = 0; i < 8; i++) {
    point = [i, Math.ceil(Math.random() * 10)];
    bars.data.push(point);
    markers.data.push(point);
  }
  
  for (i = -1; i < 9; i += 0.01){
    lines.data.push([i, i*i/8+2]);
  }
  
  graph = Flotr.draw(
    container,
    [lines, bars, markers], {
      yaxis: {
        min: 0,
        max: 11
      },
      xaxis: {
        min: -0.5,
        max: 7.5
      },
      grid: {
        verticalLines: false,
        backgroundColor: ['#fff', '#ccc']
      }
    }
  );
};

})();

