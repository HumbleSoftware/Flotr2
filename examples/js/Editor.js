(function () {

var 

  DOT           = '.',

  ON            = 'on',
  OFF           = 'off',

  CN_EDITOR     = 'flotr-example-editor',
  CN_TEXT       = 'flotr-example-editor-text',
  CN_RUN        = 'flotr-example-editor-run',
  CN_CONTROLS   = 'flotr-example-editor-controls',
  CN_TOGGLE     = 'flotr-example-editor-toggle',

  LABEL_EDIT    = 'Edit',
  LABEL_RUN     = 'Run',
  LABEL_SOURCE  = 'Source',

  TEMPLATE  = '' +
    '<div class="' + CN_EDITOR + '">' +
      '<textarea class="' + CN_TEXT + '"></textarea>' +
      '<div class="' + CN_CONTROLS + '">' +
        '<button class="' + CN_TOGGLE + '">' + LABEL_EDIT +'</button>' +
        '<button class="' + CN_RUN + '">' + LABEL_RUN + '</button>' +
      '</div>' +
    '</div>',

Editor = function (o) {
  this.options = o;
  this.editMode = OFF;
  this._initNodes();
  this._initEditor();
};

Editor.prototype = {

  setSource : function (source) {
    this._textNode.val(source);
  },

  getSource : function () {
    return this._textNode.val();
  },

  on : function () {

    var
      textNode  = this._textNode,
      preNode   = this._sourceNode.children().first(),
      height    = preNode.height(),
      width     = preNode.width(),
      position  = preNode.position();

    textNode.css({
      height : height,
      width : width,
      left : position.left,
      top : position.top
    });
    textNode.show();
    textNode.focus();

    this._toggleNode.text(LABEL_SOURCE);
    this._runNode.show();

    this.editMode = ON;
  },

  off : function () {

    this._toggleNode.text(LABEL_EDIT);
    this._runNode.hide();
    this._textNode.hide();

    this.editMode = OFF;
  },

  _initEditor : function () {
    this._toggleNode.click(_.bind(this._handleEditClick, this));
    this._runNode.click(_.bind(this._handleRunClick, this));
  },

  _initNodes : function () {

    var
      node    = this.options.node,
      editor  = $(TEMPLATE);

    this._toggleNode    = editor.find(DOT+CN_TOGGLE);
    this._textNode      = editor.find(DOT+CN_TEXT);
    this._runNode       = editor.find(DOT+CN_RUN);
    this._sourceNode    = this.options.sourceNode;
    this._editorNode    = editor;

    node.append(editor);
  },

  _handleEditClick : function () {
    if (this.editMode == OFF)
      this.on(); 
    else 
      this.off();
  },

  _handleRunClick : function () {
    var
      textNode  = this._textNode;
    try {
      eval(textNode.val());
    } catch (e) { alert(e); }
    textNode.focus();
  }
};


Flotr.Examples.Editor = Editor;

})();
