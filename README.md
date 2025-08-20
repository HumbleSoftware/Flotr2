Flotr2
======

The Canvas graphing library.

![Google Groups](http://groups.google.com/intl/en/images/logos/groups_logo_sm.gif)

http://groups.google.com/group/flotr2/

Please fork http://jsfiddle.net/cesutherland/ZFBj5/ with your question or bug reproduction case.


API
---

The API consists of a primary draw method which accepts a configuration object, helper methods, and several microlibs.

### Example

```javascript
  var
    // Container div:
    container = document.getElementById("flotr-example-graph"),
    // First data series:
    d1 = [[0, 3], [4, 8], [8, 5], [9, 13]],
    // Second data series:
    d2 = [],
    // A couple flotr configuration options:
    options = {
      xaxis: {
        minorTickFreq: 4
      }, 
      grid: {
        minorVerticalLines: true
      }
    },
    i, graph;

  // Generated second data set:
  for (i = 0; i < 14; i += 0.5) {
    d2.push([i, Math.sin(i)]);
  }

  // Draw the graph:
  graph = Flotr.draw(
    container,  // Container element
    [ d1, d2 ], // Array of data series
    options     // Configuration options
  );
```

### Microlibs

* [underscore.js](http://documentcloud.github.com/underscore/)
* [bean.js](https://github.com/fat/bean)

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

### Build System

This project uses [smoosh](https://github.com/fat/smoosh) to build and [Playwright](https://playwright.dev/) for testing.

**Commands:**
- `make` or `make all` - Run tests and build the complete library
- `make flotr2` - Build the main flotr2 library files
- `make test` - Run Playwright tests
- `npm install` - Install build and test dependencies

**Testing:**
Tests are executed using Playwright with `npm test`. The test suite includes:
- Unit tests for core functionality (Color, Graph options)
- Visual regression tests using example charts
- Chart type rendering tests

All tests run in headless Chrome for consistent, pixel-perfect rendering.

**Build Outputs:**
- `flotr2.js` - Full library with dependencies
- `flotr2.min.js` - Minified version
- `flotr2.nolibs.js` - Library without dependencies
- `flotr2.ie.min.js` - IE-specific build

### Architecture

Flotr2 is a Canvas-based JavaScript charting library with a modular plugin-based architecture.

**Core Components (`js/`):**
- `Flotr.js` - Main namespace, plugin/type registration
- `Graph.js` - Primary graph constructor and rendering orchestrator
- `Series.js` - Data series processing and normalization
- `Axis.js` - Axis calculations and rendering
- `Color.js`, `Date.js`, `DOM.js`, `Text.js` - Utility modules

**Chart Types (`js/types/`):**
Chart types define rendering behavior for different visualizations:
- `lines.js`, `bars.js`, `pie.js`, `points.js` - Basic charts
- `bubbles.js`, `candles.js`, `radar.js` - Advanced charts
- `gantt.js`, `timeline.js` - Timeline visualizations

**Plugins (`js/plugins/`):**
Plugins extend functionality through event hooks:
- `grid.js`, `legend.js`, `labels.js`, `titles.js` - Visual elements
- `selection.js`, `crosshair.js`, `hit.js` - Interactions
- `download.js`, `spreadsheet.js` - Data export

**Extension Pattern:**
- Add chart types: `Flotr.addType(name, implementation)`
- Add plugins: `Flotr.addPlugin(name, implementation)`
- Plugins use lifecycle hooks (beforedraw, afterdraw, etc.)

**Build Configuration:**
Build configurations are in `make/*.json` files defining file concatenation order.

Shoutouts
---------

Thanks to Bas Wenneker, Fabien Ménager and others for all the work on the original Flotr.
Thanks to Jochen Berger and Jordan Santell for their contributions to Flotr2.

