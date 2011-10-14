(function () {

var 

  _             = Flotr._,

  DOT           = '.',

  CN_EXAMPLE    = 'flotr-example',
  CN_LABEL      = 'flotr-example-label',
  CN_TITLE      = 'flotr-example-title',
  CN_GRAPH      = 'flotr-example-graph',
  CN_MARKUP     = 'flotr-example-description',
  CN_EDITOR     = 'flotr-example-editor',
  CN_SOURCE     = 'flotr-example-source',
  CN_CONTAINER  = 'flotr-example-source-container',

  ID_GRAPH      = 'flotr-example-graph',

  TEMPLATE      = '' +
    '<div class="' + CN_EXAMPLE + '">' +
      '<div class="' + CN_LABEL + ' ' + CN_TITLE + '"></div>' +
      '<div id="' + ID_GRAPH + '" class="' + CN_GRAPH + '"></div>' +
      '<div class="' + CN_MARKUP + '"></div>' +
      '<div class="' + CN_CONTAINER + '">' +
        '<div class="' + CN_LABEL+ '">Source:</div>' + 
        '<div class="' + CN_SOURCE + '"></div>' +
      '</div>' +
    '</div>',

Example = function (o) {

  this.options = o;
  this.example = null;

  this._initNodes();

  this._editor = new Flotr.Examples.Editor({
    node : this._exampleNode.find(DOT+CN_CONTAINER),
    sourceNode : this._sourceNode
  });
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
    if (!_.isElement(node)) node = node[0];
    var args = (example.args ? [node].concat(example.args) : [node]);
    Math.seedrandom(example.key);
    return example.callback.apply(this, args);
  },

  _initNodes : function () {

    var
      node    = this.options.node,
      example = $(TEMPLATE);

    this._titleNode   = example.find(DOT+CN_TITLE);
    this._sourceNode  = example.find(DOT+CN_SOURCE);
    this._markupNode  = example.find(DOT+CN_MARKUP);
    this._graphNode   = example.find(DOT+CN_GRAPH);
    this._exampleNode = example;

    node.append(example);
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
    this._titleNode.html(example.name);
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
      ')(document.getElementById("' + ID_GRAPH + '"' +
      args +
      '));'; 
  },

  _renderGraph : function (example) {
    Flotr.EventAdapter.stopObserving(this._graphNode[0]);
    this.current = this.executeCallback(example, this._graphNode) || null;
  }
};

Flotr.Examples.Example = Example;

})();
