(function () {

var
  E             = Flotr.EventAdapter,
  _             = Flotr._,

  CLICK         = 'click',
  EXAMPLE       = 'example',
  MOUSEENTER    = 'mouseenter',
  MOUSELEAVE    = 'mouseleave',

  DOT           = '.',

  CN_EXAMPLES   = 'flotr-examples',
  CN_CONTAINER  = 'flotr-examples-container',
  CN_RESET      = 'flotr-examples-reset',
  CN_THUMBS     = 'flotr-examples-thumbs',
  CN_THUMB      = 'flotr-examples-thumb',
  CN_COLLAPSED  = 'flotr-examples-collapsed',
  CN_HIGHLIGHT  = 'flotr-examples-highlight',
  CN_LARGE      = 'flotr-examples-large',
  CN_MEDIUM     = 'flotr-examples-medium',
  CN_SMALL      = 'flotr-examples-small',
  CN_MOBILE     = 'flotr-examples-mobile',

  T_THUMB       = '<div class="' + CN_THUMB + '"></div>',

  TEMPLATE      = '' +
    '<div class="' + CN_EXAMPLES + '">' +
      '<div class="' + CN_RESET + '">View All</div>' +
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

  //console.time(EXAMPLE);
  //console.profile();
    this._initExamples();
  //console.profileEnd();
  //console.timeEnd(EXAMPLE);
};

Examples.prototype = {

  examples : function () {

    var
      styles = {cursor : 'pointer'},
      thumbsNode = this._thumbsNode,
      list = this.list.get(),
      that = this;

    var
      order = [
        "basic",
        "basic-axis",
        "basic-bars",
        "basic-bars-horizontal",
        "basic-bar-stacked",
        "basic-stacked-horizontal",
        "basic-pie",
        "basic-radar",
        "basic-bubble",
        "basic-candle",
        "basic-candle-barchart",
        "basic-legend",
        "mouse-tracking",
        "mouse-zoom",
        "mouse-drag",
        "basic-time",
        "negative-values",
        "click-example",
        "download-image",
        "download-data",
        "advanced-titles",
        "color-gradients",
        "basic-timeline",
        "advanced-markers"
    ];

    (function runner () {
      var
        key = order.shift(),
        example = list[key];

      if (example.type === 'profile' || example.type === 'test') return;
      var node = $(T_THUMB);
      node.data('example', example);
      thumbsNode.append(node);
      that._example.executeCallback(example, node);
      node.click(function () {that._loadExample(example)});

      if (order.length)  setTimeout(runner, 20);
    })();

    function zoomHandler (e) {
      var
        node        = $(e.currentTarget),
        example     = node.data('example'),
        orientation = e.data.orientation;
      if (orientation ^ node.hasClass(CN_HIGHLIGHT)) {
        node.toggleClass(CN_HIGHLIGHT).css(styles);
        that._example.executeCallback(example, node);
      }
    }

    thumbsNode.delegate(DOT + CN_THUMB, 'mouseenter', {orientation : true}, zoomHandler);
    thumbsNode.delegate(DOT + CN_THUMB, 'mouseleave', {orientation : false}, zoomHandler);

    if ($(window).hashchange) {
      $(window).hashchange(function () {
        that._loadHash();
      });
    }
  },

  _loadExample : function (example) {
    if (example) {
      if (this._currentExample !== example) {
        this._currentExample = example;
      } else {
        return;
      }

      window.location.hash = '!'+(this.single ? 'single/' : '')+example.key;

      if (!scroller) {
        this._thumbsNode.css({
          position: 'absolute',
          height: '0px',
          overflow: 'hidden',
          width: '0px'
        });
        this._resetNode.css({
          top: '16px'
        });
      }

      this._examplesNode.addClass(CN_COLLAPSED);
      this._exampleNode.show();
      this._example.setExample(example);
      this._resize();
      $(document).scrollTop(0);
    }
  },

  _reset : function () {
    window.location.hash = '';

    if (!scroller) {
      this._thumbsNode.css({
        position: '',
        height: '',
        overflow: '',
        width: ''
      });
    }

    this._examplesNode.removeClass(CN_COLLAPSED);
    this._thumbsNode.height('');
    this._exampleNode.hide();
  },

  _initNodes : function () {

    var
      node = $(this.options.node),
      that = this,
      examplesNode = $(TEMPLATE);

    that._resetNode     = examplesNode.find(DOT+CN_RESET);
    that._exampleNode   = examplesNode.find(DOT+CN_CONTAINER);
    that._thumbsNode    = examplesNode.find(DOT+CN_THUMBS);
    that._examplesNode  = examplesNode;

    that._resetNode.click(function () {
      that._reset();
    });

    node.append(examplesNode);

    this._initResizer();
  },

  _initResizer : function () {

    var
      that = this,
      node = that._examplesNode,
      page = $(window),
      currentClass;

    $(window).resize(applySize);
    applySize();

    function applySize () {

      var
        height = page.height() - (that.options.thumbPadding || 0),
        width = page.width(),
        newClass;

      if (width > 1760) {
        newClass = CN_LARGE;
        that._thumbsNode.height(height);
      } else if (width > 1140) {
        newClass = CN_MEDIUM;
        that._thumbsNode.height(height);
      } else {
        newClass = CN_SMALL;
        that._thumbsNode.height('');
      }

      if (currentClass !== newClass) {
        if (currentClass)
          that._examplesNode.removeClass(currentClass);
        that._examplesNode.addClass(newClass);
        currentClass = newClass;
      }
    }

    this._resize = applySize;
  },
  _initExamples : function () {
    var
      hash = window.location.hash,
      example, params;

    hash = hash.substring(2);
    params = hash.split('/');

    if (params.length == 1) {
      this.examples();
      if (hash) {
        this._loadHash();
      }
    }
    else {
      if (params[0] == 'single') {
        this.single = true;
        this._loadExample(
          this.list.get(params[1])
        );
      }
    }
  },
  _loadHash : function () {

    var
      hash = window.location.hash,
      example;

    hash = hash.substring(2);
    if (hash) {
      example = this.list.get(hash);
      this._loadExample(example);
    } else {
      this._reset();
    }
  }
}

var scroller = (function () {

  var
    mobile = !!(
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPod/i)
    ),
    mozilla = !!$.browser.mozilla;

  return (!mobile || mozilla);
})();

Flotr.Examples = Examples;

})();
