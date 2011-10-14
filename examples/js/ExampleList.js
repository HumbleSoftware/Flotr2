(function () {

var ExampleList = function () {

  // Map of examples.
  this.examples = {};

};

ExampleList.prototype = {

  add : function (example) {
    this.examples[example.key] = example;
  },

  get : function (key) {
    return key ? (this.examples[key] || null) : this.examples;
  },

  getType : function (type) {
    return Flotr._.select(this.examples, function (example) {
      return (example.type === type);
    });
  }
}

Flotr.ExampleList = new ExampleList();

})();
