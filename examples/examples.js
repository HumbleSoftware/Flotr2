// Gets the value from a group of radio buttons
function getV(nl) {
  var v = null;
  _.each(nl, function(e) {
    if (e.checked) {
      v = e.value;
        return;
      }
  });
  return v;
}

(function(){
  var view = document.getElementById('code-view');
  if (view) {
    var code = document.body.getElementsByTagName('script')[0].innerHTML.replace(/\n\t\t\t/g, '\n');
    if (view.outerHTML) 
      view.outerHTML = '<pre id="code-view"><code class="javascript">' + code + '</code></pre>';
    else 
      view.innerHTML = code;
  }
  
  document.getElementById('wrapper').getElementsByTagName('h1')[0].innerHTML =
    document.getElementsByTagName('title')[0].innerHTML;
})();
