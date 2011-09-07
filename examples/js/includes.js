yepnope([
  // Libs
  '../lib/bean-min.js',
  '../lib/underscore-min.js',
  {
  test : (navigator.appVersion.indexOf("MSIE") != -1  && parseFloat(navigator.appVersion.split("MSIE")[1]) < 9),
    // Load for IE < 9
    yep : [
      '../lib/excanvas.js',
      '../lib/base64.js'
    ]
  },
  '../lib/canvas2image.js',
  '../lib/canvastext.js',
  'lib/google-code-prettify/prettify.js',
  'lib/beautify.js',
  'lib/randomseed.js',

  // Flotr
  '../js/Flotr.js',
  '../js/DefaultOptions.js',
  '../js/Color.js',
  '../js/Date.js',
  '../js/DOM.js',
  '../js/EventAdapter.js',
  '../js/Graph.js',
  '../js/Axis.js',
  '../js/Series.js',
  '../js/types/lines.js',
  '../js/types/bars.js',
  '../js/types/points.js',
  '../js/types/pie.js',
  '../js/types/candles.js',
  '../js/types/markers.js',
  '../js/types/radar.js',
  '../js/types/bubbles.js',
  '../js/plugins/download.js',
  '../js/plugins/selection.js',
  '../js/plugins/spreadsheet.js',
  '../js/plugins/grid.js',
  '../js/plugins/hit.js',
  '../js/plugins/crosshair.js',
  '../js/plugins/labels.js',
  '../js/plugins/legend.js',
  '../js/plugins/titles.js',
  '../js/types/gantt.js',

  // Examples
  'js/Flotr.Examples.js',
  'js/Flotr.ExampleList.js',
  'js/examples/basic.js',
  'js/examples/basic-axis.js',
  'js/examples/basic-bars.js',
  'js/examples/basic-bars-stacked.js',
  'js/examples/basic-pie.js',
  'js/examples/basic-radar.js',
  'js/examples/basic-bubble.js',
  'js/examples/basic-candle.js',
  'js/examples/basic-legend.js',
  'js/examples/mouse-tracking.js',
  'js/examples/mouse-zoom.js',
  'js/examples/mouse-drag.js',
  'js/examples/basic-time.js',
  'js/examples/negative-values.js',
  'js/examples/click-example.js',
  'js/examples/download-image.js',
  'js/examples/download-data.js',
  'js/examples/advanced-titles.js',
  'js/examples/color-gradients.js',

  { complete : function () { Examples = new Flotr.Examples(); } }
]);
