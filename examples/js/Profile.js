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
