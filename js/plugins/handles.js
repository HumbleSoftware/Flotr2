/** 
 * Selection Handles Plugin
 *
 * Depends upon options.selection.mode
 *
 * Options
 *  show - True enables the handles plugin.
 *  drag - Left and Right drag handles
 *  scroll - Scrolling handle
 */
(function () {

var D = Flotr.DOM,
  E = Flotr.EventAdapter,
  o, s, el, container, left, right, scroll, delta, X,
  moveHandler;

Flotr.addPlugin('handles', {

  options: {
    show: false,
    drag: true,
    scroll: true
  },

  callbacks: {
    'flotr:afterinit': init,
    'flotr:select': handleSelect,
    'flotr:mousedown': reset,
    'flotr:mousemove': mouseMoveHandler
  }

});


function init() {

  var graph = this;

  if (!graph.options.selection.mode || !graph.options.handles.show) return;

  el = graph.el;
  o = graph.options.handles;

  container = D.node('<div class="flotr-handles"></div>');

  // Drag handles
  if (o.drag) {
    right = D.node('<div class="flotr-handles-handle flotr-handles-drag flotr-handles-right"></div>');
    left  = D.node('<div class="flotr-handles-handle flotr-handles-drag flotr-handles-left"></div>');
    D.insert(container, right);
    D.insert(container, left);

    E.observe(left, 'mousedown', function () {
      moveHandler = leftMoveHandler;
    });
    E.observe(right, 'mousedown', function () {
      moveHandler = rightMoveHandler;
    });
  }

  // Scroll handle
  if (o.scroll) {
    scroll = D.node('<div class="flotr-handles-handle flotr-handles-scroll"></div>');
    D.insert(container, scroll);
    E.observe(scroll, 'mousedown', function () {
      moveHandler = scrollMoveHandler;
    });
  }

  E.observe(document, 'mouseup', function() {
    moveHandler = null;
  });

  hide();
  D.insert(el, container);
}


function handleSelect(selection) {

  show();

  s = selection;

  if (o.drag) {
    positionDrag(this, left, selection.x1);
    positionDrag(this, right, selection.x2);
  }

  if (o.scroll) {
    positionScroll(
      this,
      scroll,
      selection.x1,
      selection.x2
    );
  }
}

function positionDrag(graph, handle, x) {

  var size = D.size(handle),
    l = Math.round(graph.axes.x.d2p(x) - size.width / 2),
    t = (graph.plotHeight - size.height) / 2;

  D.setStyles(handle, {
    'left' : l+'px',
    'top'  : t+'px'
  });
}

function positionScroll(graph, handle, x1, x2) {

  var size = D.size(handle),
    l = Math.round(graph.axes.x.d2p(x1)),
    t = (graph.plotHeight) - size.height / 2,
    w = (graph.axes.x.d2p(x2) - graph.axes.x.d2p(x1));

  D.setStyles(handle, {
    'left' : l+'px',
    'top'  : t+'px',
    'width': w+'px'
  });
}

function reset() {
  hide();
}

function show() {
  if (o.drag) {
    D.show(left);
    D.show(right);
  }
  if (o.scroll) D.show(scroll);
}
function hide() {
  if (o.drag) {
    D.hide(left);
    D.hide(right);
  }
  if (o.scroll) {
    D.hide(scroll);
  }
}

function leftMoveHandler(area, delta) {
  area.x1 += delta;
}

function rightMoveHandler(area, delta) {
  area.x2 += delta;
}

function scrollMoveHandler(area, delta) {
  area.x1 += delta;
  area.x2 += delta;
}

function mouseMoveHandler(e, position) {

  if (!moveHandler) return;

  var delta = position.dX,
    selection = this.selection.selection,
    area = this.selection.getArea();
  moveHandler(area, delta);
  checkSwap(area);
  this.selection.setSelection(area);
}

function checkSwap(area) {
  if (area.x1 > area.x2) {
    if (moveHandler == leftMoveHandler) {
      moveHandler = rightMoveHandler;
    } else if (moveHandler == rightMoveHandler) {
      moveHandler = leftMoveHandler;
    }
  }
}

})();
