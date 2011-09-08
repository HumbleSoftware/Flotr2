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
  ID_EXAMPLE_EDIT       = 'example-edit',
  ID_EXAMPLE_EDITOR     = 'example-editor',
  ID_EXAMPLE_RUN        = 'example-run',
  ID_EXAMPLE_HIGHLIGHT  = 'example-highlight',
  ID_EXAMPLES           = 'examples',

  CN_COLLAPSED          = 'collapsed',
  CN_HIGHLIGHT          = 'highlight',

  T_EXAMPLE             = '<div class="example"></div>',

Examples = function (o) {

  if (_.isUndefined(Flotr.ExampleList)) throw "Flotr.ExampleList not defined.";

  this.editMode = 'off';
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
    this._initExamples();
    this._initEditor();
  },

  example : function (example) {

    var 
      exampleNode   = document.getElementById(ID_EXAMPLE),
      examplesNode  = document.getElementById(ID_EXAMPLES),
      editorNode    = document.getElementById(ID_EXAMPLE_EDITOR),
      labelNode     = document.getElementById(ID_EXAMPLE_LABEL),
      graphNode     = document.getElementById(ID_EXAMPLE_GRAPH),
      sourceNode    = document.getElementById(ID_EXAMPLE_SOURCE),
      markupNode    = document.getElementById(ID_EXAMPLE_MARKUP),
      exampleString = this._getExampleString(example);

    D.setStyles(exampleNode, { display: 'block' });
    D.show(sourceNode);
    this._editModeOff();

    this.current = this._executeCallback(example, graphNode) || null;
    this.currentExample = example;

    window.location.hash = '!'+(this.single ? 'single/' : '')+example.key;

    // Markup Changes
    sourceNode.innerHTML = '<pre class="prettyprint javascript">'+exampleString+'</pre>';
    editorNode.value = example.editorText || exampleString;
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

      if (example.type === 'profile') return;

      var
        node = D.node(T_EXAMPLE),
        styles = {cursor : 'pointer'},
        link = D.node('<a name="!'+example.key+'"></a>"');

      D.insert(link, node);
      D.insert(examplesNode, link);

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

  _initEditor : function () {

    var
      editNode    = document.getElementById(ID_EXAMPLE_EDIT),
      editorNode  = document.getElementById(ID_EXAMPLE_EDITOR),
      runNode     = document.getElementById(ID_EXAMPLE_RUN);

    Flotr.EventAdapter.observe(editNode, CLICK, _.bind(function () {
      if (this.editMode == 'off') {
        this._editModeOn(); 
      }
      else {
        this.example(this.currentExample);
      }
    }, this));

    Flotr.EventAdapter.observe(runNode, CLICK, _.bind(function () {
      try {
        eval(editorNode.value);
      } catch (e) { alert(e); }
      editorNode.focus();
      this.currentExample.editorText = editorNode.value;
    }, this));
  },

  _editModeOn : function () {

    var
      editNode    = document.getElementById(ID_EXAMPLE_EDIT),
      editorNode  = document.getElementById(ID_EXAMPLE_EDITOR),
      runNode     = document.getElementById(ID_EXAMPLE_RUN),
      sourceNode  = document.getElementById(ID_EXAMPLE_SOURCE),
      size        = D.size(sourceNode);

    D.setStyles(editorNode, { display: 'block', height: size.height+'px' });
    D.addClass(runNode, 'example-edit');
    D.hide(sourceNode);

    editorNode.focus();
    editNode.innerHTML = 'Source';

    this.editMode = 'on';
  },

  _editModeOff : function () {

    var
      editNode    = document.getElementById(ID_EXAMPLE_EDIT),
      editorNode  = document.getElementById(ID_EXAMPLE_EDITOR),
      runNode     = document.getElementById(ID_EXAMPLE_RUN);

    editNode.innerHTML = 'Edit';
    if (this.currentExample) this.currentExample.editorText = editorNode.value;
    D.removeClass(runNode, 'example-edit');

    this._hideEditor();

  },

  _hideEditor : function () {
    var editorNode = document.getElementById(ID_EXAMPLE_EDITOR);
    D.setStyles(editorNode, { display: 'none' });
    this.editMode = 'off';
  }
}

Flotr.Examples = Examples;

})();
