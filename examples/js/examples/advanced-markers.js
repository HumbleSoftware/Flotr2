(function () {

Flotr.ExampleList.add({
  key : 'advanced-markers',
  name : 'Advanced Markers',
  callback : advanced_markers,
  timeout : 100
});

function advanced_markers (container) {

  var
    xmark = new Image(),
    checkmark = new Image(),
    bars = {
      data: [],
      bars: {
        show: true,
        barWidth: 0.6,
        lineWidth: 0,
        fillOpacity: 0.8
      }
    }, markers = {
      data: [],
      markers: {
        show: true,
        position: 'ct',
        labelFormatter: function (o) {
          return (o.y >= 5) ? checkmark : xmark;
        }
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

  var runner = Flotr._.after(2, function () {
    graph = Flotr.draw(
      container,
      [bars, markers], {
        yaxis: {
          min: 0,
          max: 11
        },
        xaxis: {
          min: -0.5,
          max: 7.5
        },
        grid: {
          verticalLines: false
        }
      }
    );
  });

  xmark.onload = runner;
  checkmark.onload = runner;
  xmark.src = 'images/xmark.png';
  checkmark.src = 'images/checkmark.png';
};

})();

