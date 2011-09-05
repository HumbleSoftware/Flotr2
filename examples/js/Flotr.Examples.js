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
  /*
  console.time(ID_EXAMPLES);
  console.profile();
  */
  this.init();
  /*
  console.profileEnd();
  console.timeEnd(ID_EXAMPLES);
  */

};

Examples.prototype = {

  init : function () {
    this.examples();
  },

  example : function (example) {
    var 
      exampleNode   = document.getElementById(ID_EXAMPLE),
      labelNode     = document.getElementById(ID_EXAMPLE_LABEL),
      graphNode     = document.getElementById(ID_EXAMPLE_GRAPH),
      sourceNode    = document.getElementById(ID_EXAMPLE_SOURCE),
      markupNode    = document.getElementById(ID_EXAMPLE_MARKUP),
      exampleString = this.getExampleString(example);

    D.setStyles(exampleNode, { display: 'block' });

    this.executeCallback(example, graphNode);
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

    _.each(this.list, function (example) {

      var node = D.node(T_EXAMPLE),
        styles = {cursor : 'pointer'};

      D.insert(examplesNode, node);
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

        /*
        var position = D.position(node);
        this.highlight(example, position);
        */

    }, this);

    /*
    E.observe(highlightNode, CLICK, _.bind(function () {
      this.example(this._highlightExample);
      D.addClass(examplesNode, CN_COLLAPSED);
      D.setStyles(highlightNode, {display : 'none'});
    }, this));
    */
  },

  highlight : function (example, position) {

    /*
    var node = document.getElementById(ID_EXAMPLE_HIGHLIGHT),
      styles;

    D.setStyles(node, {display : 'block'});

    this._highlightExample = example;
    this.executeCallback(example, node);

    styles = {
      cursor : 'pointer',
      left: (position.left - 15) + 'px',
      top: (position.top - 10) + 'px',
      position: 'absolute'
    };

    D.setStyles(node, styles);
    */
  },

  executeCallback : function (example, node) {
    var args = (example.args ? [node].concat(example.args) : [node]);
    example.callback.apply(this, args);
  },

  getExampleString : function (example) {
    var args = (example.args ? ', '+example.args.join(', ') : '');
    return '' +
      '<pre class="prettyprint javascript">(' +
      example.callback +
      ')(document.getElementById("' + ID_EXAMPLE_GRAPH + '"' +
      args +
      '));</pre>';
  }
}

Flotr.Examples = Examples;

})();
