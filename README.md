Flotr2
======

The Canvas graphing library.

API
---

The API consists of a primary draw method whicha accepts a configuration object, helper methods, and several microlibs.

### Example

```javascript
(function basic(container) {

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
})(document.getElementById("flotr-example-graph"));
```

### Microlibs

* [underscore.js](http://documentcloud.github.com/underscore/)
* [bean.js](http://documentcloud.github.com/underscore/)

Extending
---------

Flotr may be extended by adding new plugins and graph types.

### Graph Types

Graph types define how a particular chart is rendered.  Examples include line, bar, pie.

Existing graph types are found in `js/types/`.

### Plugins

Plugins extend the core of flotr with new functionality.  They can add interactions, new decorations, etc.  Examples 
include titles, labels and selection.

The plugins included are found in `js/plugins/`.

Development
-----------

This project uses [smoosh](https://github.com/fat/smoosh) to build and [jasmine](http://pivotal.github.com/jasmine/) 
with [js-imagediff](https://github.com/HumbleSoftware/js-imagediff) to test.  Tests may be executed by 
[jasmine-headless-webkit](http://johnbintz.github.com/jasmine-headless-webkit/) with 
`cd spec; jasmine-headless-webkit -j jasmine.yml -c` or by a browser by navigating to 
`flotr2/spec/SpecRunner.html`.
