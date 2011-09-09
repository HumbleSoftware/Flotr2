(function () {

var 

  ID_EXAMPLE            = '#example',
  ID_EXAMPLE_LABEL      = '#example-label',
  ID_EXAMPLE_GRAPH      = '#example-graph',
  ID_EXAMPLE_SOURCE     = '#example-source',
  ID_EXAMPLE_MARKUP     = '#example-description',

Example = function (o) {

  this.options = o;
  this.example = null;

  this._initNodes();

  this._editor = new Flotr.Examples.Editor();
};

Example.prototype = {

  setExample : function (example) {

    this._renderSource(example);
    this._renderGraph(example);

    this.example = example;
  },

  getExample : function () {
    return this.example;
  },

  executeCallback : function (example, node) {
    var args = (example.args ? [node].concat(example.args) : [node]);
    Math.seedrandom(example.key);
    return example.callback.apply(this, args);
  },

  _initNodes : function () {
    this._exampleNode = $(ID_EXAMPLE);
    this._labelNode   = $(ID_EXAMPLE_LABEL);
    this._sourceNode  = $(ID_EXAMPLE_SOURCE);
    this._markupNode  = $(ID_EXAMPLE_MARKUP);
    this._graphNode   = $(ID_EXAMPLE_GRAPH);
  },

  _renderSource : function (example) {

    var
      sourceNode = this._sourceNode,
      exampleString = this._getSource(example);

    // Example
    this._exampleNode.css({ display: 'block' });

    // Source
    sourceNode.show();
    sourceNode.html('<pre class="prettyprint javascript">' + exampleString + '</pre>');

    // Editor
    if (this.example) this.example.editorText = this._editor.getSource();
    this._editor.off();
    this._editor.setSource(example.editorText || exampleString);

    // Label
    this._labelNode.html(example.name);
    this._markupNode.html(example.description || '');

    // Code Styling
    prettyPrint();
  },

  _getSource : function (example) {

    var
      args = (example.args ? ', '+example.args.join(', ') : ''),
      callback = example.callback + '';

    // Hack for FF code style
    if (navigator.userAgent.search(/firefox/i) !== -1)
      callback = js_beautify(callback);

    return '' +
      '(' +
      callback +
      ')(document.getElementById("' + ID_EXAMPLE_GRAPH.substr(1) + '"' +
      args +
      '));'; 
  },

  _renderGraph : function (example) {
    this.current = this.executeCallback(example, this._graphNode[0]) || null;
  }
};

Flotr.Examples.Example = Example;

})();
