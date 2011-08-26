(function () {

var D = Flotr.DOM;

var Examples = function (o) {

  if (_.isUndefined(Flotr.ExampleList)) throw "Flotr.ExampleList not defined.";

  this.list = Flotr.ExampleList;
  console.time('examples');
  this.init();
  console.timeEnd('examples');

};

Examples.prototype = {

  init : function () {
    this.examples();
    this.example(this.list[0]);
  },

  example : function (example) {
    var 
      exampleNode   = document.getElementById('example'),
      sourceNode    = document.getElementById('example-source'),
      exampleString = this.getExampleString(example);

    example.callback.apply(this, [exampleNode]);
    sourceNode.innerHTML = exampleString;
    prettyPrint();
  },

  examples : function () {

    var examplesNode = document.getElementById('examples');

    _.each(this.list, function (example) {

      var node = D.node('<div class="example"></div>');

      D.insert(examplesNode, node);
      example.callback.apply(this, [node]);

    }, this);

  },

  getExampleString : function (example) {
    return '<pre class="prettyprint javascript">('+example.callback+')(document.getElementById("example"));</pre>';
  }
}

Flotr.Examples = Examples;

})();
