(function () {

var 
  D                     = Flotr.DOM,
  CLICK                 = 'click',
  ID_EXAMPLE_EDIT       = 'example-edit',
  ID_EXAMPLE_EDITOR     = 'example-editor',
  ID_EXAMPLE_RUN        = 'example-run',
  ID_EXAMPLE_SOURCE     = 'example-source',

Editor = function () {
  this.editMode = 'off';
  this._initEditor();
};

Editor.prototype = {

  setSource : function (source) {
    var editorNode = document.getElementById(ID_EXAMPLE_EDITOR);
    editorNode.value = source;
  },

  _initEditor : function () {

    var
      editNode    = document.getElementById(ID_EXAMPLE_EDIT),
      editorNode  = document.getElementById(ID_EXAMPLE_EDITOR),
      runNode     = document.getElementById(ID_EXAMPLE_RUN);

    Flotr.EventAdapter.observe(editNode, CLICK, _.bind(function () {
      if (this.editMode == 'off') {
        this.on(); 
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

  on : function () {

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

  off : function () {

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
};


Flotr.Examples.Editor = Editor;

})();
