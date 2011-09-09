(function () {

var 
  D                     = Flotr.DOM,

  ID_EXAMPLE_EDIT       = '#example-edit',
  ID_EXAMPLE_EDITOR     = '#example-editor',
  ID_EXAMPLE_RUN        = '#example-run',
  ID_EXAMPLE_SOURCE     = '#example-source',

  CN_EXAMPLE_EDIT       = 'example-edit',

Editor = function () {
  this.editMode = 'off';
  this._initNodes();
  this._initEditor();
};

Editor.prototype = {

  setSource : function (source) {
    this._editorNode.val(source);
  },

  getSource : function () {
    return this._editorNode.val();
  },

  on : function () {

    var
      editor = this._editorNode,
      height = this._sourceNode.height();

    editor.css({ display : 'block', height : height+'px' });
    editor.focus();

    this._runNode.addClass(CN_EXAMPLE_EDIT);
    this._sourceNode.hide();
    this._editNode.text('Source');

    this.editMode = 'on';
  },

  off : function () {
    this._editNode.text('Edit');
    this._runNode.removeClass('example-edit');
    this._sourceNode.show();
    this._hideEditor();
  },

  _initEditor : function () {
    this._editNode.click(_.bind(this._handleEditClick, this));
    this._runNode.click(_.bind(this._handleRunClick, this));
  },

  _initNodes : function () {
    this._editNode    = $(ID_EXAMPLE_EDIT);
    this._editorNode  = $(ID_EXAMPLE_EDITOR);
    this._runNode     = $(ID_EXAMPLE_RUN);
    this._sourceNode  = $(ID_EXAMPLE_SOURCE);
  },

  _hideEditor : function () {
    this._editorNode.css({ display: 'none' });
    this.editMode = 'off';
  },

  _handleEditClick : function () {
    if (this.editMode == 'off')
      this.on(); 
    else 
      this.off();
  },

  _handleRunClick : function () {
    var
      editorNode  = this._editorNode;
    try {
      eval(editorNode.val());
    } catch (e) { alert(e); }
    editorNode.focus();
  }
};


Flotr.Examples.Editor = Editor;

})();
