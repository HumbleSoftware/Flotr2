(function () {

var

  E             = Flotr.EventAdapter,

  CLICK         = 'click',
  MOUSEOVER     = 'mouseover',
  MOUSEOUT      = 'mouseout',

  DOT           = '.',

  CN_EXAMPLES   = 'flotr-examples',
  CN_CONTAINER  = 'flotr-examples-container',
  CN_THUMBS     = 'flotr-examples-thumbs',
  CN_THUMB      = 'flotr-examples-thumb',
  CN_COLLAPSED  = 'flotr-examples-collapsed',
  CN_HIGHLIGHT  = 'flotr-examples-highlight',

  T_THUMB       = '<div class="' + CN_THUMB + '"></div>',

  TEMPLATE      = '' +
    '<div class="' + CN_EXAMPLES + '">' +
      '<div class="' + CN_THUMBS + '"></div>' +
      '<div class="' + CN_CONTAINER + '"></div>' +
    '</div>'

Examples = function (o) {

  if (_.isUndefined(Flotr.ExampleList)) throw "Flotr.ExampleList not defined.";

  this.options = o;
  this.list = Flotr.ExampleList;
  this.current = null;
  this.single = false;

  this._initNodes();
  this._example = new Flotr.Examples.Example({
    node : this._exampleNode
  });

  //console.time(ID_EXAMPLES);
  //console.profile();
    this._initExamples();
  //console.profileEnd();
  //console.timeEnd(ID_EXAMPLES);
};

Examples.prototype = {

  examples : function () {

    var
      thumbsNode = this._thumbsNode;

    _.each(this.list.get(), function (example) {

      if (example.type === 'profile') return;

      var
        node = $(T_THUMB),
        styles = {cursor : 'pointer'};

      thumbsNode.append(node);

      this._example.executeCallback(example, node);

      var mouseOverObserver = _.bind(function (e) {

        node.addClass(CN_HIGHLIGHT).css(styles);
        this._example.executeCallback(example, node);
        node.css(styles);

        E.stopObserving(node[0], MOUSEOVER, mouseOverObserver);
        setTimeout(function () {
          E.observe(node[0], MOUSEOUT, mouseOutObserver);
        }, 25);
      }, this);

      var mouseOutObserver = _.bind(function (e) {
        node.removeClass(CN_HIGHLIGHT);
        this._example.executeCallback(example, node);
        node.css(styles);
        E.stopObserving(node[0], MOUSEOUT, mouseOutObserver);
        setTimeout(function () {
          E.observe(node[0], MOUSEOVER, mouseOverObserver);
        }, 25);
      }, this);

      E.observe(node[0], MOUSEOVER, mouseOverObserver);
      E.observe(node[0], CLICK, _.bind(function () { this._loadExample(example) }, this));

    }, this);
  },

  _loadExample : function (example) {
    if (example) {
      window.location.hash = '!'+(this.single ? 'single/' : '')+example.key;
      this._examplesNode.addClass(CN_COLLAPSED);
      this._thumbsNode.height($(window).height());
      this._example.setExample(example);
    }
  },

  _initNodes : function () {

    var
      node = $(this.options.node),
      examplesNode = $(TEMPLATE);

    this._exampleNode   = examplesNode.find(DOT+CN_CONTAINER);
    this._thumbsNode    = examplesNode.find(DOT+CN_THUMBS);
    this._examplesNode  = examplesNode;

    node.append(examplesNode);
  },

  _initExamples : function () {

    var
      hash = window.location.hash,
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

      this._loadExample(example);

    } else {
      this.examples();
    }
  },
}

Flotr.Examples = Examples;

})();
