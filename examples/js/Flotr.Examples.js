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

  console.time(ID_EXAMPLES);
  console.profile();
  this.init();
  console.profileEnd();
  console.timeEnd(ID_EXAMPLES);

};

Examples.prototype = {

  init : function () {

    this._initExamples();

  },

  example : function (example) {

    var 
      exampleNode   = document.getElementById(ID_EXAMPLE),
      examplesNode  = document.getElementById(ID_EXAMPLES),
      labelNode     = document.getElementById(ID_EXAMPLE_LABEL),
      graphNode     = document.getElementById(ID_EXAMPLE_GRAPH),
      sourceNode    = document.getElementById(ID_EXAMPLE_SOURCE),
      markupNode    = document.getElementById(ID_EXAMPLE_MARKUP),
      exampleString = this.getExampleString(example);

    D.setStyles(exampleNode, { display: 'block' });

    this.current = this.executeCallback(example, graphNode) || null;

    window.location.hash = '!'+example.key;

    // Markup Changes
    sourceNode.innerHTML = exampleString;
    labelNode.innerHTML = example.name;
    if (example.description) {
      markupNode.innerHTML = example.description;
    }

    prettyPrint();
  },

  examples : function () {

    var
      examplesNode = document.getElementById(ID_EXAMPLES),
      highlightNode = document.getElementById(ID_EXAMPLE_HIGHLIGHT);

    _.each(this.list.get(), function (example) {

      var
        node = D.node(T_EXAMPLE),
        styles = {cursor : 'pointer'},
        link = D.node('<a name="!'+example.key+'"></a>"');

      D.insert(link, node);
      D.insert(examplesNode, link);

      this.executeCallback(example, node);

      var mouseOverObserver = _.bind(function (e) {
        D.addClass(node, CN_HIGHLIGHT);
        this.executeCallback(example, node);
        D.setStyles(node, styles);
        E.stopObserving(node, MOUSEOVER, mouseOverObserver);
        setTimeout(function () {
          E.observe(node, MOUSEOUT, mouseOutObserver);
        }, 25);
      }, this);

      var mouseOutObserver = _.bind(function (e) {
        D.removeClass(node, CN_HIGHLIGHT);
        this.executeCallback(example, node);
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

  executeCallback : function (example, node) {
    var args = (example.args ? [node].concat(example.args) : [node]);
    Math.seedrandom(example.key);
    return example.callback.apply(this, args);
  },

  getExampleString : function (example) {
    var args = (example.args ? ', '+example.args.join(', ') : '');
    return '' +
      '<pre class="prettyprint javascript">(' +
      example.callback +
      ')(document.getElementById("' + ID_EXAMPLE_GRAPH + '"' +
      args +
      '));</pre>';
  },

  _initExamples : function () {

    var
      hash = window.location.hash,
      examplesNode = document.getElementById(ID_EXAMPLES),
      example;

    this.examples();

    if (hash) {
      hash = hash.substring(2);
      example = this.list.get(hash);

      if (example) {
        this.example(example);
        D.addClass(examplesNode, CN_COLLAPSED);
      }
    }
  }
}

Flotr.Examples = Examples;

})();
