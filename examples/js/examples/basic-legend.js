(function () {

Flotr.ExampleList.add({
  key : 'basic-legend',
  name : 'Basic Legend',
  callback : basic_legend
});

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

})();
