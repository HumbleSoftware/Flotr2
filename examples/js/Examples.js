(function () {

var
  D                     = Flotr.DOM,
  E                     = Flotr.EventAdapter,
  CLICK                 = 'click',
  MOUSEOVER             = 'mouseover',
  MOUSEOUT              = 'mouseout',

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
    this._example = new Flotr.Examples.Example({
      node : $('#content')
    });
    this._initExamples();
  },

  examples : function () {

    var
      examplesNode = document.getElementById(ID_EXAMPLES);

    _.each(this.list.get(), function (example) {

      if (example.type === 'profile') return;

      var
        node = D.node(T_EXAMPLE),
        styles = {cursor : 'pointer'};

      D.insert(examplesNode, node);

      this._example.executeCallback(example, node);

      var mouseOverObserver = _.bind(function (e) {
        D.addClass(node, CN_HIGHLIGHT);
        this._example.executeCallback(example, node);
        D.setStyles(node, styles);
        E.stopObserving(node, MOUSEOVER, mouseOverObserver);
        setTimeout(function () {
          E.observe(node, MOUSEOUT, mouseOutObserver);
        }, 25);
      }, this);

      var mouseOutObserver = _.bind(function (e) {
        D.removeClass(node, CN_HIGHLIGHT);
        this._example.executeCallback(example, node);
        D.setStyles(node, styles);
        E.stopObserving(node, MOUSEOUT, mouseOutObserver);
        setTimeout(function () {
          E.observe(node, MOUSEOVER, mouseOverObserver);
        }, 25);
      }, this);

      E.observe(node, MOUSEOVER, mouseOverObserver);
      E.observe(node, CLICK, _.bind(function () { this._loadExample(example) }, this));

    }, this);
  },

  _loadExample : function (example) {
    var
      examplesNode = document.getElementById(ID_EXAMPLES);

    if (example) {
      window.location.hash = '!'+(this.single ? 'single/' : '')+example.key;
      D.addClass(examplesNode, CN_COLLAPSED);
      this._example.setExample(example);
    }
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
