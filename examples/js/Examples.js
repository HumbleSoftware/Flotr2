(function () {

var
  D                     = Flotr.DOM,
  E                     = Flotr.EventAdapter,
  CLICK                 = 'click',
  MOUSEOVER             = 'mouseover',
  MOUSEOUT              = 'mouseout',

  ID_EXAMPLE            = 'example',
  ID_EXAMPLE_LABEL      = 'example-label',
  ID_EXAMPLE_GRAPH      = 'example-graph',
  ID_EXAMPLE_SOURCE     = 'example-source',
  ID_EXAMPLE_MARKUP     = 'example-description',
  ID_EXAMPLE_HIGHLIGHT  = 'example-highlight',
  ID_EXAMPLES           = 'examples',

  CN_COLLAPSED          = 'collapsed',
  CN_HIGHLIGHT          = 'highlight',

  T_EXAMPLE             = '<div class="example"></div>',

Examples = function (o) {

  if (_.isUndefined(Flotr.ExampleList)) throw "Flotr.ExampleList not defined.";

  this.list = Flotr.ExampleList;
  this.current = null;
  this.single = false;

  //console.time(ID_EXAMPLES);
  //console.profile();
  this.init();
  //console.profileEnd();
  //console.timeEnd(ID_EXAMPLES);

};

Examples.prototype = {

  init : function () {
    this._editor = new Flotr.Examples.Editor();
    this._initExamples();
  },

  example : function (example) {
    this._renderSource(example);
    this._renderGraph(example);
  },

  examples : function () {

    var
      examplesNode = document.getElementById(ID_EXAMPLES),
      highlightNode = document.getElementById(ID_EXAMPLE_HIGHLIGHT);

    _.each(this.list.get(), function (example) {

      if (example.type === 'profile') return;

      var
        node = D.node(T_EXAMPLE),
        styles = {cursor : 'pointer'};

      D.insert(examplesNode, node);

      this._executeCallback(example, node);

      var mouseOverObserver = _.bind(function (e) {
        D.addClass(node, CN_HIGHLIGHT);
        this._executeCallback(example, node);
        D.setStyles(node, styles);
        E.stopObserving(node, MOUSEOVER, mouseOverObserver);
        setTimeout(function () {
          E.observe(node, MOUSEOUT, mouseOutObserver);
        }, 25);
      }, this);

      var mouseOutObserver = _.bind(function (e) {
        D.removeClass(node, CN_HIGHLIGHT);
        this._executeCallback(example, node);
        D.setStyles(node, styles);
        E.stopObserving(node, MOUSEOUT, mouseOutObserver);
        setTimeout(function () {
          E.observe(node, MOUSEOVER, mouseOverObserver);
        }, 25);
      }, this);

      E.observe(node, MOUSEOVER, mouseOverObserver);
      E.observe(node, CLICK, _.bind(function () {
        this.example(example);
        D.addClass(examplesNode, CN_COLLAPSED);
      }, this));

    }, this);
  },

  _renderSource : function (example) {

    var
      exampleNode   = document.getElementById(ID_EXAMPLE),
      labelNode     = document.getElementById(ID_EXAMPLE_LABEL),
      sourceNode    = document.getElementById(ID_EXAMPLE_SOURCE),
      markupNode    = document.getElementById(ID_EXAMPLE_MARKUP),
      exampleString = this._getExampleString(example);

    window.location.hash = '!'+(this.single ? 'single/' : '')+example.key;

    D.setStyles(exampleNode, { display: 'block' });
    D.show(sourceNode);

    if (this.currentExample) this.currentExample.editorText = this._editor.getSource();
    this._editor.off();

    sourceNode.innerHTML = '<pre class="prettyprint javascript">'+exampleString+'</pre>';

    this._editor.setSource(example.editorText || exampleString);

    labelNode.innerHTML = example.name;
    if (example.description) {
      markupNode.innerHTML = example.description;
    }

    prettyPrint();
  },

  _renderGraph : function (example) {
    var 
      graphNode = document.getElementById(ID_EXAMPLE_GRAPH);
    this.current = this._executeCallback(example, graphNode) || null;
    this.currentExample = example;
  },

  _executeCallback : function (example, node) {
    var args = (example.args ? [node].concat(example.args) : [node]);
    Math.seedrandom(example.key);
    return example.callback.apply(this, args);
  },

  _getExampleString : function (example) {

    var
      args = (example.args ? ', '+example.args.join(', ') : ''),
      callback = example.callback + '';

    if (navigator.userAgent.search(/firefox/i) !== -1)
      callback = js_beautify(callback);

    return '' +
      '(' +
      callback +
      ')(document.getElementById("' + ID_EXAMPLE_GRAPH + '"' +
      args +
      '));'; 
  },

  _initExamples : function () {

    var
      hash = window.location.hash,
      examplesNode = document.getElementById(ID_EXAMPLES),
      example,
      params;

    if (hash) {
      hash = hash.substring(2);
      params = hash.split('/');

      if (params.length == 1) {
        example = this.list.get(hash);
        this.examples();
      }
      else {
        if (params[0] == 'single') {
          this.single = true;
          example = this.list.get(params[1]);
        }
      }

      if (example) {
        this.example(example);
        D.addClass(examplesNode, CN_COLLAPSED);
      }

    } else {
      this.examples();
    }
  },
}

Flotr.Examples = Examples;

})();
