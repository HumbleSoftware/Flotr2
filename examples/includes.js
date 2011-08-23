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

  // Examples
  'examples.js',

  // Flotr
  '../js/Flotr.js',
  '../js/Flotr.defaultOptions.js',
  '../js/Flotr.Color.js',
  '../js/Flotr.Date.js',
  '../js/Flotr.DOM.js',
  '../js/Flotr.EventAdapter.js',
  '../js/Flotr.Graph.js',
  '../js/Flotr.Axis.js',
  '../js/Flotr.Series.js',
  '../js/types/lines.js',
  '../js/types/bars.js',
  '../js/types/points.js',
  '../js/types/pie.js',
  '../js/types/candles.js',
  '../js/types/markers.js',
  '../js/types/radar.js',
  '../js/types/bubbles.js',
  '../js/plugins/selection.js',
  '../js/plugins/spreadsheet.js',
  '../js/plugins/hit.js',
  '../js/plugins/crosshair.js',
  '../js/plugins/labels.js',
  '../js/plugins/legend.js',
  '../js/plugins/titles.js',
  '../js/types/gantt.js',
  { complete : example }
]);
