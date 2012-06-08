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
        "half-pie",
        "basic-radar",
        "basic-bubble",
        "basic-candle",
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

(function () {

var 
  _             = Flotr._,

  DOT           = '.',

  CN_EXAMPLE    = 'flotr-example',
  CN_LABEL      = 'flotr-example-label',
  CN_TITLE      = 'flotr-example-title',
  CN_MARKUP     = 'flotr-example-description',
  CN_EDITOR     = 'flotr-example-editor',

  ID_GRAPH      = 'flotr-example-graph',

  TEMPLATE      = '' +
    '<div class="' + CN_EXAMPLE + '">' +
      '<div class="' + CN_LABEL + ' ' + CN_TITLE + '"></div>' +
      '<div class="' + CN_MARKUP + '"></div>' +
      '<div class="' + CN_EDITOR + '"></div>' +
    '</div>',

Example = function (o) {

  this.options = o;
  this.example = null;

  this._initNodes();
};

Example.prototype = {

  setExample : function (example) {

    var
      source = this.getSource(example),
      editorNode = this._editorNode;

    this.example = example;

    Math.seedrandom(example.key);
    this._exampleNode.css({ display: 'block' });
    this._titleNode.html(example.name || '');
    this._markupNode.html(example.description || '');

    if (!this._editor) {
      this._editor = new Flotr.Examples.Editor(editorNode, {
          args : example.args,
          example : source,
          teardown : function () {
            // Unbind event listeners from previous examples
            Flotr.EventAdapter.stopObserving($(editorNode).find('.render')[0]);
            $(editorNode).find('canvas').each(function (index, canvas) {
              Flotr.EventAdapter.stopObserving(canvas);
            });
          }
      });
    } else {
      this._editor.setExample(source, example.args);
    }
  },

  getSource : function (example) {

    var
      source = example.callback.toString();

    // Hack for FF code style
    if (navigator.userAgent.search(/firefox/i) !== -1)
      source = js_beautify(source);

    return source;
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

    this._titleNode   = example.find(DOT + CN_TITLE);
    this._markupNode  = example.find(DOT + CN_MARKUP);
    this._editorNode  = example.find(DOT + CN_EDITOR);
    this._exampleNode = example;

    node.append(example);
  }
};

Flotr.Examples.Example = Example;

})();

(function () {

  var
    ONERROR   = window.onerror,
    COUNT     = 0,
    TYPES     = {},

    T_CONTROLS =
      '<div class="controls">' +
        '<button class="run btn large primary">Run</button>' +
      '</div>',
    T_EDITOR = '<div class="editor"></div>',
    T_SOURCE = '<div class="source"></div>',
    T_ERRORS = '<div class="errors"></div>',
    T_RENDER = '<div class="render"></div>',
    T_IFRAME = '<iframe></iframe>';


  // Javascript type:
  TYPES.javascript = function Javascript (o) {
    this.onerror = o.onerror;
  };
  TYPES.javascript.prototype = {
    codeMirrorType : 'javascript',
    example : function (o) {

      var
        example = o.example,
        render = o.render,
        renderId = $(render).attr('id'),
        args = o.args ? ',' + o.args.toString() : '';

      return '(' + example + ')(document.getElementById("' + renderId+ '")' +
          args + ');';
    },
    render : function (o) {
      eval(o.example);
    }
  };

  // HTML Type:
  TYPES.html = function Html (o) {
    this.onerror = o.onerror;
  };
  TYPES.html.prototype = {
    codeMirrorType : 'htmlmixed',
    example : function (o) {
      return $.trim(o.example);
    },
    render : function (o) {

      var
        example = o.example,
        render = o.render,
        iframe = $(T_IFRAME),
        that = this,
        win, doc;

      render.html(iframe);

      win = iframe[0].contentWindow;

      doc = win.document;
      doc.open();

      // Error
      win.onerror = iframe.onerror = function () {
        that.onerror.apply(null, arguments);
      }

      doc.write(example);
      doc.close();
    }
  };

  // Editor
  function Editor (container, o) {

    var
      type      = o.type || 'javascript',
      example   = o.example || '',
      noRun     = o.noRun || false,
      teardown  = o.teardown || false,
      controls  = $(T_CONTROLS),
      render    = $(T_RENDER),
      errors    = $(T_ERRORS),
      source    = $(T_SOURCE),
      node      = $(T_EDITOR),
      renderId  = 'editor-render-' + COUNT,
      api,
      render,
      codeMirror;

    api = new TYPES[type]({
      onerror : onerror
    });
    if (!api) throw 'Invalid type: API not found for type `' + type + '`.';

    render
      .attr('id', renderId);

    errors
      .hide();

    node
      .append(render)
      .append(controls)
      .append(source)
      .addClass(type)
      .addClass(noRun ? 'no-run' : '');

    container = $(container);
    container
      .append(node);

    source
      .append(errors)

    example = api.example({
      args : o.args,
      example : example,
      render : render
    });

    codeMirror = CodeMirror(source[0], {
      value : example,
      readOnly : noRun,
      lineNumbers : true,
      mode : api.codeMirrorType
    });

    if (!noRun) {
      controls.delegate('.run', 'click', function () {
        example = codeMirror.getValue();
        execute();
      });

      execute();
    }

    // Error handling:
    window.onerror = function (message, url, line) {

      onerror(message, url, line);
      console.log(message);

      if (ONERROR && $.isFunction(ONERROR)) {
        return ONERROR(message, url, line);
      } else {
        return false;
      }
    }

    // Helpers

    function execute () {
      errors.hide();
      if (teardown) {
        teardown.call();
      }
      api.render({
        example : example,
        render : render
      });
    }

    function onerror (message, url, line) {
      // @TODO Find some js error normalizing lib

      var
        doThatSexyThang = false,
        html = '<span class="error">Error: </span>',
        error, stack;

      /*
      // Native error type handling:
      if (typeof (message) !== 'string') {
        error = message;
        message = error.message;
        stack = error.stack;

        //if (stack) {
          console.log(stack);
        //}

        //console.log(message);

      }

      */

      html += '<span class="message">' + message + '</span>';
      if (typeof (line) !== "undefined") {
        html += '<span class="position">';
        html += 'Line <span class="line">' + line + '</span>';
        console.log(url);
        if (url) {
          html += ' of ';
          if (url == window.location) {
            html += '<span class="url">script</span>';
            if (doThatSexyThang) {
              //codeMirror.setMarker(line, '&#8226;');
            }
          } else {
            html += '<span class="url">' + url + '</span>';
          }
        }
        html += '.</span>';
      }

      errors.show();
      errors.html(html);
    }

    COUNT++;

    this.setExample = function (source, args) {
      example = api.example({
        args : args,
        example : source,
        render : render
      });
      codeMirror.setValue(example);
      codeMirror.refresh();
      execute();
    }
  }

  if (typeof Flotr.Examples === 'undefined') Flotr.Examples = {};
  Flotr.Examples.Editor = Editor;
})();

(function () {

var
  D                     = Flotr.DOM,
  E                     = Flotr.EventAdapter,
  _                     = Flotr._,
  CLICK                 = 'click',

  ID_EXAMPLE_PROFILE    = 'example-profile',
  ID_EXAMPLES           = 'examples',

Profile = function (o) {

  if (_.isUndefined(Flotr.ExampleList)) throw "Flotr.ExampleList not defined.";

  this.editMode = 'off';
  this.list = Flotr.ExampleList;
  this.current = null;
  this.single = false;

  this.init();
};

Profile.prototype = _.extend({}, Flotr.Examples.prototype, {

  examples : function () {
    var
      examplesNode  = document.getElementById(ID_EXAMPLES),
      listNode      = D.node('<ul></ul>'),
      profileNode;

    _.each(this.list.getType('profile'), function (example) {
      profileNode = D.node('<li>' + example.name + '</li>');
      D.insert(listNode, profileNode);
      E.observe(profileNode, CLICK, _.bind(function () {
        this.example(example);
      }, this));
    }, this);

    D.insert(examplesNode, listNode);
  },

  example : function (example) {
    this._renderSource(example);
    this.profileStart(example);
    setTimeout(_.bind(function () {
      this._renderGraph(example);
      this.profileEnd();
    }, this), 50);
  },

  profileStart : function (example) {
    var profileNode = document.getElementById(ID_EXAMPLE_PROFILE);
    this._startTime = new Date();
    profileNode.innerHTML = '<div>Profile started for "'+example.name+'"...</div>';
  },

  profileEnd : function (example) {
    var
      profileNode = document.getElementById(ID_EXAMPLE_PROFILE);
      profileTime = (new Date()) - this._startTime;

    this._startTime = null;

    profileNode.innerHTML += '<div>Profile complete: '+profileTime+'ms<div>';
  }

});

Flotr.Profile = Profile;

})();
