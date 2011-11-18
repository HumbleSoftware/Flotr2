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

  _.each(TestFlotr.ExampleList.examples, function (example, key) {

    it('should draw a `' + example.name + '`line graph', function () {

      a = executeExampleTest(example, StableFlotr, nodeA);
      b = executeExampleTest(example, TestFlotr, nodeB);

      expect(b).toImageDiffEqual(a);
    });
  });

  function executeExampleTest (example, flotr, node) {
    Math.seedrandom(example.key);
    Flotr = flotr;
    example.callback(node);
    return node.graph.ctx;
  }

  function buildNode () {
    var node = document.createElement('div');
    document.body.appendChild(node);
    node.style.width = '320px';
    node.style.height = '240px';
    return node;
  }

  function destroyNode (node) {
    document.body.removeChild(node);
  }
});

describe('Colors', function () {

  it('should have a color class', function () {
    expect(Flotr.Color).not.toBeUndefined();
  });

  it('should create a color', function () {
    var color = new Flotr.Color(0, 0, 0, 0);
    expect(color).toBeTruthy();
  });

  it('should have rgba attributes', function () {
    var color = new Flotr.Color(0, 0, 0, 0);
    expect(color.r).toEqual(0);
    expect(color.g).toEqual(0);
    expect(color.b).toEqual(0);
    expect(color.a).toEqual(1.0);
  });
});
