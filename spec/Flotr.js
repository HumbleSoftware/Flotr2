describe('Plots', function () {

  var
    nodeA, nodeB,
    a, b;

  beforeEach(function () {

    // Add imagediff matchers
    this.addMatchers(imagediff.jasmine);

    nodeA = buildNode();
    nodeB = buildNode();
  });

  afterEach(function () {
    destroyNode(nodeA);
    destroyNode(nodeB);
    a = b = null;
  });

  it('should draw a line graph', function () {
    Flotr = StableFlotr;
    basic(nodeA);
    a = nodeA.graph.ctx;

    Flotr = TestFlotr;
    basic(nodeB);
    b = nodeB.graph.ctx;

    expect(b).toImageDiffEqual(a);
  });

  function buildNode () {
    var node = document.createElement('div');
    document.body.appendChild(node);
    node.style.width = '640px';
    node.style.height = '480px';
    return node;
  }

  function destroyNode (node) {
    document.body.removeChild(node);
  }

  function basic(container) {

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
  }
});
