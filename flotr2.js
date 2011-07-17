/*!
  * bean.js - copyright Jacob Thornton 2011
  * https://github.com/fat/bean
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
!function (context) {
  var __uid = 1, registry = {}, collected = {},
      overOut = /over|out/,
      namespace = /[^\.]*(?=\..*)\.|.*/,
      stripName = /\..*/,
      addEvent = 'addEventListener',
      attachEvent = 'attachEvent',
      removeEvent = 'removeEventListener',
      detachEvent = 'detachEvent',
      doc = context.document || {},
      root = doc.documentElement || {},
      W3C_MODEL = root[addEvent],
      eventSupport = W3C_MODEL ? addEvent : attachEvent,

  isDescendant = function (parent, child) {
    var node = child.parentNode;
    while (node !== null) {
      if (node == parent) {
        return true;
      }
      node = node.parentNode;
    }
  },

  retrieveUid = function (obj, uid) {
    return (obj.__uid = uid || obj.__uid || __uid++);
  },

  retrieveEvents = function (element) {
    var uid = retrieveUid(element);
    return (registry[uid] = registry[uid] || {});
  },

  listener = W3C_MODEL ? function (element, type, fn, add) {
    element[add ? addEvent : removeEvent](type, fn, false);
  } : function (element, type, fn, add, custom) {
    custom && add && (element['_on' + custom] = element['_on' + custom] || 0);
    element[add ? attachEvent : detachEvent]('on' + type, fn);
  },

  nativeHandler = function (element, fn, args) {
    return function (event) {
      event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || context).event);
      return fn.apply(element, [event].concat(args));
    };
  },

  customHandler = function (element, fn, type, condition, args) {
    return function (e) {
      if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : e && e.propertyName == '_on' + type || !e) {
        fn.apply(element, Array.prototype.slice.call(arguments, e ? 0 : 1).concat(args));
      }
    };
  },

  addListener = function (element, orgType, fn, args) {
    var type = orgType.replace(stripName, ''),
        events = retrieveEvents(element),
        handlers = events[type] || (events[type] = {}),
        originalFn = fn,
        uid = retrieveUid(fn, orgType.replace(namespace, ''));
    if (handlers[uid]) {
      return element;
    }
    var custom = customEvents[type];
    if (custom) {
      fn = custom.condition ? customHandler(element, fn, type, custom.condition) : fn;
      type = custom.base || type;
    }
    var isNative = nativeEvents[type];
    fn = isNative ? nativeHandler(element, fn, args) : customHandler(element, fn, type, false, args);
    isNative = W3C_MODEL || isNative;
    if (type == 'unload') {
      var org = fn;
      fn = function () {
        removeListener(element, type, fn) && org();
      };
    }
    element[eventSupport] && listener(element, isNative ? type : 'propertychange', fn, true, !isNative && type);
    handlers[uid] = fn;
    fn.__uid = uid;
    fn.__originalFn = originalFn;
    return type == 'unload' ? element : (collected[retrieveUid(element)] = element);
  },

  removeListener = function (element, orgType, handler) {
    var uid, names, uids, i, events = retrieveEvents(element), type = orgType.replace(stripName, '');
    if (!events || !events[type]) {
      return element;
    }
    names = orgType.replace(namespace, '');
    uids = names ? names.split('.') : [handler.__uid];
    for (i = uids.length; i--;) {
      uid = uids[i];
      handler = events[type][uid];
      delete events[type][uid];
      if (element[eventSupport]) {
        type = customEvents[type] ? customEvents[type].base : type;
        var isNative = W3C_MODEL || nativeEvents[type];
        listener(element, isNative ? type : 'propertychange', handler, false, !isNative && type);
      }
    }
    return element;
  },

  del = function (selector, fn, $) {
    return function (e) {
      var array = typeof selector == 'string' ? $(selector, this) : selector;
      for (var target = e.target; target && target != this; target = target.parentNode) {
        for (var i = array.length; i--;) {
          if (array[i] == target) {
            return fn.apply(target, arguments);
          }
        }
      }
    };
  },

  add = function (element, events, fn, delfn, $) {
    if (typeof events == 'object' && !fn) {
      for (var type in events) {
        events.hasOwnProperty(type) && add(element, type, events[type]);
      }
    } else {
      var isDel = typeof fn == 'string', types = (isDel ? fn : events).split(' ');
      fn = isDel ? del(events, delfn, $) : fn;
      for (var i = types.length; i--;) {
        addListener(element, types[i], fn, Array.prototype.slice.call(arguments, isDel ? 4 : 3));
      }
    }
    return element;
  },

  remove = function (element, orgEvents, fn) {
    var k, type, events, i,
        isString = typeof(orgEvents) == 'string',
        names = isString && orgEvents.replace(namespace, ''),
        rm = removeListener,
        attached = retrieveEvents(element);
    if (isString && /\s/.test(orgEvents)) {
      orgEvents = orgEvents.split(' ');
      i = orgEvents.length - 1;
      while (remove(element, orgEvents[i]) && i--) {}
      return element;
    }
    events = isString ? orgEvents.replace(stripName, '') : orgEvents;
    if (!attached || (isString && !attached[events])) {
      if (attached && names) {
        for (k in attached) {
          if (attached.hasOwnProperty(k)) {
            for (i in attached[k]) {
              attached[k].hasOwnProperty(i) && i === names && rm(element, [k, names].join('.'));
            }
          }
        }
      }
      return element;
    }
    if (typeof fn == 'function') {
      rm(element, events, fn);
    } else if (names) {
      rm(element, orgEvents);
    } else {
      rm = events ? rm : remove;
      type = isString && events;
      events = events ? (fn || attached[events] || events) : attached;
      for (k in events) {
        if (events.hasOwnProperty(k)) {
          rm(element, type || k, events[k]);
          delete events[k]; // remove unused leaf keys
        }
      }
    }
    return element;
  },

  fire = function (element, type, args) {
    var evt, k, i, types = type.split(' ');
    for (i = types.length; i--;) {
      type = types[i].replace(stripName, '');
      var isNative = nativeEvents[type],
          isNamespace = types[i].replace(namespace, ''),
          handlers = retrieveEvents(element)[type];
      if (isNamespace) {
        isNamespace = isNamespace.split('.');
        for (k = isNamespace.length; k--;) {
          handlers && handlers[isNamespace[k]] && handlers[isNamespace[k]].apply(element, [false].concat(args));
        }
      } else if (!args && element[eventSupport]) {
        fireListener(isNative, type, element);
      } else {
        for (k in handlers) {
          handlers.hasOwnProperty(k) && handlers[k].apply(element, [false].concat(args));
        }
      }
    }
    return element;
  },

  fireListener = W3C_MODEL ? function (isNative, type, element) {
    evt = document.createEvent(isNative ? "HTMLEvents" : "UIEvents");
    evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, context, 1);
    element.dispatchEvent(evt);
  } : function (isNative, type, element) {
    isNative ? element.fireEvent('on' + type, document.createEventObject()) : element['_on' + type]++;
  },

  clone = function (element, from, type) {
    var events = retrieveEvents(from), obj, k;
    var uid = retrieveUid(element);
    obj = type ? events[type] : events;
    for (k in obj) {
      obj.hasOwnProperty(k) && (type ? add : clone)(element, type || from, type ? obj[k].__originalFn : k);
    }
    return element;
  },

  fixEvent = function (e) {
    var result = {};
    if (!e) {
      return result;
    }
    var type = e.type, target = e.target || e.srcElement;
    result.preventDefault = fixEvent.preventDefault(e);
    result.stopPropagation = fixEvent.stopPropagation(e);
    result.target = target && target.nodeType == 3 ? target.parentNode : target;
    if (~type.indexOf('key')) {
      result.keyCode = e.which || e.keyCode;
    } else if ((/click|mouse|menu/i).test(type)) {
      result.rightClick = e.which == 3 || e.button == 2;
      result.pos = { x: 0, y: 0 };
      if (e.pageX || e.pageY) {
        result.clientX = e.pageX;
        result.clientY = e.pageY;
      } else if (e.clientX || e.clientY) {
        result.clientX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        result.clientY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }
      overOut.test(type) && (result.relatedTarget = e.relatedTarget || e[(type == 'mouseover' ? 'from' : 'to') + 'Element']);
    }
    for (var k in e) {
      if (!(k in result)) {
        result[k] = e[k];
      }
    }
    return result;
  };

  fixEvent.preventDefault = function (e) {
    return function () {
      if (e.preventDefault) {
        e.preventDefault();
      }
      else {
        e.returnValue = false;
      }
    };
  };

  fixEvent.stopPropagation = function (e) {
    return function () {
      if (e.stopPropagation) {
        e.stopPropagation();
      } else {
        e.cancelBubble = true;
      }
    };
  };

  var nativeEvents = { click: 1, dblclick: 1, mouseup: 1, mousedown: 1, contextmenu: 1, //mouse buttons
    mousewheel: 1, DOMMouseScroll: 1, //mouse wheel
    mouseover: 1, mouseout: 1, mousemove: 1, selectstart: 1, selectend: 1, //mouse movement
    keydown: 1, keypress: 1, keyup: 1, //keyboard
    orientationchange: 1, // mobile
    touchstart: 1, touchmove: 1, touchend: 1, touchcancel: 1, // touch
    gesturestart: 1, gesturechange: 1, gestureend: 1, // gesture
    focus: 1, blur: 1, change: 1, reset: 1, select: 1, submit: 1, //form elements
    load: 1, unload: 1, beforeunload: 1, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
    error: 1, abort: 1, scroll: 1 }; //misc

  function check(event) {
    var related = event.relatedTarget;
    if (!related) {
      return related === null;
    }
    return (related != this && related.prefix != 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related));
  }

  var customEvents = {
    mouseenter: { base: 'mouseover', condition: check },
    mouseleave: { base: 'mouseout', condition: check },
    mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
  };

  var bean = { add: add, remove: remove, clone: clone, fire: fire };

  var clean = function (el) {
    var uid = remove(el).__uid;
    if (uid) {
      delete collected[uid];
      delete registry[uid];
    }
  };

  if (context[attachEvent]) {
    add(context, 'unload', function () {
      for (var k in collected) {
        collected.hasOwnProperty(k) && clean(collected[k]);
      }
      context.CollectGarbage && CollectGarbage();
    });
  }

  var oldBean = context.bean;
  bean.noConflict = function () {
    context.bean = oldBean;
    return this;
  };

  (typeof module !== 'undefined' && module.exports) ?
    (module.exports = bean) :
    (context['bean'] = bean);

}(this);
//     Underscore.js 1.1.7
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    // Exported as a string, for Closure Compiler "advanced" mode.
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.1.7';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result |= iterator.call(context, value, index, list)) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion produced by an iterator
  _.groupBy = function(obj, iterator) {
    var result = {};
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Get the last element of an array.
  _.last = function(array) {
    return array[array.length - 1];
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted) {
    return _.reduce(array, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) memo[memo.length] = el;
      return memo;
    }, []);
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and another.
  // Only the elements present in just the first array will remain.
  _.difference = function(array, other) {
    return _.filter(array, function(value){ return !_.include(other, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };


  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };


  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    // Check object identity.
    if (a === b) return true;
    // Different types?
    var atype = typeof(a), btype = typeof(b);
    if (atype != btype) return false;
    // Basic equality test (watch out for coercions).
    if (a == b) return true;
    // One is falsy and the other truthy.
    if ((!a && b) || (a && !b)) return false;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // One of them implements an isEqual()?
    if (a.isEqual) return a.isEqual(b);
    if (b.isEqual) return b.isEqual(a);
    // Check dates' integer values.
    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
    // Both are NaN?
    if (_.isNaN(a) && _.isNaN(b)) return false;
    // Compare regular expressions.
    if (_.isRegExp(a) && _.isRegExp(b))
      return a.source     === b.source &&
             a.global     === b.global &&
             a.ignoreCase === b.ignoreCase &&
             a.multiline  === b.multiline;
    // If a is not an object by this point, we can't handle it.
    if (atype !== 'object') return false;
    // Check for different array lengths before comparing contents.
    if (a.length && (a.length !== b.length)) return false;
    // Nothing else worked, deep compare the contents.
    var aKeys = _.keys(a), bKeys = _.keys(b);
    // Different object sizes?
    if (aKeys.length != bKeys.length) return false;
    // Recursive comparison of contents.
    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
    return true;
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false;
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();

/*
 * Canvas2Image v0.1
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 */

var Canvas2Image = (function() {
  // check if we have canvas support
  var oCanvas = document.createElement("canvas"),
      sc = String.fromCharCode,
      strDownloadMime = "image/octet-stream",
      bReplaceDownloadMime = false;
  
  // no canvas, bail out.
  if (!oCanvas.getContext) {
    return {
      saveAsBMP : function(){},
      saveAsPNG : function(){},
      saveAsJPEG : function(){}
    }
  }

  var bHasImageData = !!(oCanvas.getContext("2d").getImageData),
      bHasDataURL = !!(oCanvas.toDataURL),
      bHasBase64 = !!(window.btoa);

  // ok, we're good
  var readCanvasData = function(oCanvas) {
    var iWidth = parseInt(oCanvas.width),
        iHeight = parseInt(oCanvas.height);
    return oCanvas.getContext("2d").getImageData(0,0,iWidth,iHeight);
  }

  // base64 encodes either a string or an array of charcodes
  var encodeData = function(data) {
    var i, aData, strData = "";
    
    if (typeof data == "string") {
      strData = data;
    } else {
      aData = data;
      for (i = 0; i < aData.length; i++) {
        strData += sc(aData[i]);
      }
    }
    return btoa(strData);
  }

  // creates a base64 encoded string containing BMP data takes an imagedata object as argument
  var createBMP = function(oData) {
    var strHeader = '',
        iWidth = oData.width,
        iHeight = oData.height;

    strHeader += 'BM';
  
    var iFileSize = iWidth*iHeight*4 + 54; // total header size = 54 bytes
    strHeader += sc(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
    strHeader += sc(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
    strHeader += sc(iFileSize % 256); iFileSize = Math.floor(iFileSize / 256);
    strHeader += sc(iFileSize % 256);

    strHeader += sc(0, 0, 0, 0, 54, 0, 0, 0); // data offset
    strHeader += sc(40, 0, 0, 0); // info header size

    var iImageWidth = iWidth;
    strHeader += sc(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
    strHeader += sc(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
    strHeader += sc(iImageWidth % 256); iImageWidth = Math.floor(iImageWidth / 256);
    strHeader += sc(iImageWidth % 256);
  
    var iImageHeight = iHeight;
    strHeader += sc(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
    strHeader += sc(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
    strHeader += sc(iImageHeight % 256); iImageHeight = Math.floor(iImageHeight / 256);
    strHeader += sc(iImageHeight % 256);
  
    strHeader += sc(1, 0, 32, 0); // num of planes & num of bits per pixel
    strHeader += sc(0, 0, 0, 0); // compression = none
  
    var iDataSize = iWidth*iHeight*4; 
    strHeader += sc(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
    strHeader += sc(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
    strHeader += sc(iDataSize % 256); iDataSize = Math.floor(iDataSize / 256);
    strHeader += sc(iDataSize % 256); 
  
    strHeader += sc(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); // these bytes are not used
  
    var aImgData = oData.data,
        strPixelData = "",
        c, x, y = iHeight,
        iOffsetX, iOffsetY, strPixelRow;
    
    do {
      iOffsetY = iWidth*(y-1)*4;
      strPixelRow = "";
      for (x = 0; x < iWidth; x++) {
        iOffsetX = 4*x;
        strPixelRow += sc(
          aImgData[iOffsetY + iOffsetX + 2], // B
          aImgData[iOffsetY + iOffsetX + 1], // G
          aImgData[iOffsetY + iOffsetX],     // R
          aImgData[iOffsetY + iOffsetX + 3]  // A
        );
      }
      strPixelData += strPixelRow;
    } while (--y);

    return encodeData(strHeader + strPixelData);
  }

  // sends the generated file to the client
  var saveFile = function(strData) {
    if (!window.open(strData)) {
      document.location.href = strData;
    }
  }

  var makeDataURI = function(strData, strMime) {
    return "data:" + strMime + ";base64," + strData;
  }

  // generates a <img> object containing the imagedata
  var makeImageObject = function(strSource) {
    var oImgElement = document.createElement("img");
    oImgElement.src = strSource;
    return oImgElement;
  }

  var scaleCanvas = function(oCanvas, iWidth, iHeight) {
    if (iWidth && iHeight) {
      var oSaveCanvas = document.createElement("canvas");
      
      oSaveCanvas.width = iWidth;
      oSaveCanvas.height = iHeight;
      oSaveCanvas.style.width = iWidth+"px";
      oSaveCanvas.style.height = iHeight+"px";

      var oSaveCtx = oSaveCanvas.getContext("2d");

      oSaveCtx.drawImage(oCanvas, 0, 0, oCanvas.width, oCanvas.height, 0, 0, iWidth, iWidth);
      
      return oSaveCanvas;
    }
    return oCanvas;
  }

  return {
    saveAsPNG : function(oCanvas, bReturnImg, iWidth, iHeight) {
      if (!bHasDataURL) return false;
      
      var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight),
          strMime = "image/png",
          strData = oScaledCanvas.toDataURL(strMime);
        
      if (bReturnImg) {
        return makeImageObject(strData);
      } else {
        saveFile(bReplaceDownloadMime ? strData.replace(strMime, strDownloadMime) : strData);
      }
      return true;
    },

    saveAsJPEG : function(oCanvas, bReturnImg, iWidth, iHeight) {
      if (!bHasDataURL) return false;

      var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight),
          strMime = "image/jpeg",
          strData = oScaledCanvas.toDataURL(strMime);
  
      // check if browser actually supports jpeg by looking for the mime type in the data uri. if not, return false
      if (strData.indexOf(strMime) != 5) return false;

      if (bReturnImg) {
        return makeImageObject(strData);
      } else {
        saveFile(bReplaceDownloadMime ? strData.replace(strMime, strDownloadMime) : strData);
      }
      return true;
    },

    saveAsBMP : function(oCanvas, bReturnImg, iWidth, iHeight) {
      if (!(bHasDataURL && bHasImageData && bHasBase64)) return false;

      var oScaledCanvas = scaleCanvas(oCanvas, iWidth, iHeight),
          strMime = "image/bmp",
          oData = readCanvasData(oScaledCanvas),
          strImgData = createBMP(oData);
        
      if (bReturnImg) {
        return makeImageObject(makeDataURI(strImgData, strMime));
      } else {
        saveFile(makeDataURI(strImgData, strMime));
      }
      return true;
    }
  };
})();
/**
 * This code is released to the public domain by Jim Studt, 2007.
 * He may keep some sort of up to date copy at http://www.federated.com/~jim/canvastext/
 * It as been modified by Fabien M�nager to handle font style like size, weight, color and rotation. 
 * A partial support for special characters has been added too.
 */
var CanvasText = {
  /** The letters definition. It is a list of letters, 
   * with their width, and the coordinates of points compositing them.
   * The syntax for the points is : [x, y], null value means "pen up"
   */
  letters: {
    '\n':{ width: -1, points: [] },
    ' ': { width: 10, points: [] },
    '!': { width: 10, points: [[5,21],[5,7],null,[5,2],[4,1],[5,0],[6,1],[5,2]] },
    '"': { width: 16, points: [[4,21],[4,14],null,[12,21],[12,14]] },
    '#': { width: 21, points: [[11,25],[4,-7],null,[17,25],[10,-7],null,[4,12],[18,12],null,[3,6],[17,6]] },
    '$': { width: 20, points: [[8,25],[8,-4],null,[12,25],[12,-4],null,[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
    '%': { width: 24, points: [[21,21],[3,0],null,[8,21],[10,19],[10,17],[9,15],[7,14],[5,14],[3,16],[3,18],[4,20],[6,21],[8,21],null,[17,7],[15,6],[14,4],[14,2],[16,0],[18,0],[20,1],[21,3],[21,5],[19,7],[17,7]] },
    '&': { width: 26, points: [[23,12],[23,13],[22,14],[21,14],[20,13],[19,11],[17,6],[15,3],[13,1],[11,0],[7,0],[5,1],[4,2],[3,4],[3,6],[4,8],[5,9],[12,13],[13,14],[14,16],[14,18],[13,20],[11,21],[9,20],[8,18],[8,16],[9,13],[11,10],[16,3],[18,1],[20,0],[22,0],[23,1],[23,2]] },
    '\'':{ width: 10, points: [[5,19],[4,20],[5,21],[6,20],[6,18],[5,16],[4,15]] },
    '(': { width: 14, points: [[11,25],[9,23],[7,20],[5,16],[4,11],[4,7],[5,2],[7,-2],[9,-5],[11,-7]] },
    ')': { width: 14, points: [[3,25],[5,23],[7,20],[9,16],[10,11],[10,7],[9,2],[7,-2],[5,-5],[3,-7]] },
    '*': { width: 16, points: [[8,21],[8,9],null,[3,18],[13,12],null,[13,18],[3,12]] },
    '+': { width: 26, points: [[13,18],[13,0],null,[4,9],[22,9]] },
    ',': { width: 10, points: [[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
    '-': { width: 26, points: [[4,9],[22,9]] },
    '.': { width: 10, points: [[5,2],[4,1],[5,0],[6,1],[5,2]] },
    '/': { width: 22, points: [[20,25],[2,-7]] },
    '0': { width: 20, points: [[9,21],[6,20],[4,17],[3,12],[3,9],[4,4],[6,1],[9,0],[11,0],[14,1],[16,4],[17,9],[17,12],[16,17],[14,20],[11,21],[9,21]] },
    '1': { width: 20, points: [[6,17],[8,18],[11,21],[11,0]] },
    '2': { width: 20, points: [[4,16],[4,17],[5,19],[6,20],[8,21],[12,21],[14,20],[15,19],[16,17],[16,15],[15,13],[13,10],[3,0],[17,0]] },
    '3': { width: 20, points: [[5,21],[16,21],[10,13],[13,13],[15,12],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
    '4': { width: 20, points: [[13,21],[3,7],[18,7],null,[13,21],[13,0]] },
    '5': { width: 20, points: [[15,21],[5,21],[4,12],[5,13],[8,14],[11,14],[14,13],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
    '6': { width: 20, points: [[16,18],[15,20],[12,21],[10,21],[7,20],[5,17],[4,12],[4,7],[5,3],[7,1],[10,0],[11,0],[14,1],[16,3],[17,6],[17,7],[16,10],[14,12],[11,13],[10,13],[7,12],[5,10],[4,7]] },
    '7': { width: 20, points: [[17,21],[7,0],null,[3,21],[17,21]] },
    '8': { width: 20, points: [[8,21],[5,20],[4,18],[4,16],[5,14],[7,13],[11,12],[14,11],[16,9],[17,7],[17,4],[16,2],[15,1],[12,0],[8,0],[5,1],[4,2],[3,4],[3,7],[4,9],[6,11],[9,12],[13,13],[15,14],[16,16],[16,18],[15,20],[12,21],[8,21]] },
    '9': { width: 20, points: [[16,14],[15,11],[13,9],[10,8],[9,8],[6,9],[4,11],[3,14],[3,15],[4,18],[6,20],[9,21],[10,21],[13,20],[15,18],[16,14],[16,9],[15,4],[13,1],[10,0],[8,0],[5,1],[4,3]] },
    ':': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],null,[5,2],[4,1],[5,0],[6,1],[5,2]] },
    ';': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],null,[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
    '<': { width: 24, points: [[20,18],[4,9],[20,0]] },
    '=': { width: 26, points: [[4,12],[22,12],null,[4,6],[22,6]] },
    '>': { width: 24, points: [[4,18],[20,9],[4,0]] },
    '?': { width: 18, points: [[3,16],[3,17],[4,19],[5,20],[7,21],[11,21],[13,20],[14,19],[15,17],[15,15],[14,13],[13,12],[9,10],[9,7],null,[9,2],[8,1],[9,0],[10,1],[9,2]] },
    '@': { width: 27, points: [[18,13],[17,15],[15,16],[12,16],[10,15],[9,14],[8,11],[8,8],[9,6],[11,5],[14,5],[16,6],[17,8],null,[12,16],[10,14],[9,11],[9,8],[10,6],[11,5],null,[18,16],[17,8],[17,6],[19,5],[21,5],[23,7],[24,10],[24,12],[23,15],[22,17],[20,19],[18,20],[15,21],[12,21],[9,20],[7,19],[5,17],[4,15],[3,12],[3,9],[4,6],[5,4],[7,2],[9,1],[12,0],[15,0],[18,1],[20,2],[21,3],null,[19,16],[18,8],[18,6],[19,5]] },
    'A': { width: 18, points: [[9,21],[1,0],null,[9,21],[17,0],null,[4,7],[14,7]] },
    'B': { width: 21, points: [[4,21],[4,0],null,[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],null,[4,11],[13,11],[16,10],[17,9],[18,7],[18,4],[17,2],[16,1],[13,0],[4,0]] },
    'C': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5]] },
    'D': { width: 21, points: [[4,21],[4,0],null,[4,21],[11,21],[14,20],[16,18],[17,16],[18,13],[18,8],[17,5],[16,3],[14,1],[11,0],[4,0]] },
    'E': { width: 19, points: [[4,21],[4,0],null,[4,21],[17,21],null,[4,11],[12,11],null,[4,0],[17,0]] },
    'F': { width: 18, points: [[4,21],[4,0],null,[4,21],[17,21],null,[4,11],[12,11]] },
    'G': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[18,8],null,[13,8],[18,8]] },
    'H': { width: 22, points: [[4,21],[4,0],null,[18,21],[18,0],null,[4,11],[18,11]] },
    'I': { width: 8,  points: [[4,21],[4,0]] },
    'J': { width: 16, points: [[12,21],[12,5],[11,2],[10,1],[8,0],[6,0],[4,1],[3,2],[2,5],[2,7]] },
    'K': { width: 21, points: [[4,21],[4,0],null,[18,21],[4,7],null,[9,12],[18,0]] },
    'L': { width: 17, points: [[4,21],[4,0],null,[4,0],[16,0]] },
    'M': { width: 24, points: [[4,21],[4,0],null,[4,21],[12,0],null,[20,21],[12,0],null,[20,21],[20,0]] },
    'N': { width: 22, points: [[4,21],[4,0],null,[4,21],[18,0],null,[18,21],[18,0]] },
    'O': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21]] },
    'P': { width: 21, points: [[4,21],[4,0],null,[4,21],[13,21],[16,20],[17,19],[18,17],[18,14],[17,12],[16,11],[13,10],[4,10]] },
    'Q': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21],null,[12,4],[18,-2]] },
    'R': { width: 21, points: [[4,21],[4,0],null,[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[4,11],null,[11,11],[18,0]] },
    'S': { width: 20, points: [[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
    'T': { width: 16, points: [[8,21],[8,0],null,[1,21],[15,21]] },
    'U': { width: 22, points: [[4,21],[4,6],[5,3],[7,1],[10,0],[12,0],[15,1],[17,3],[18,6],[18,21]] },
    'V': { width: 18, points: [[1,21],[9,0],null,[17,21],[9,0]] },
    'W': { width: 24, points: [[2,21],[7,0],null,[12,21],[7,0],null,[12,21],[17,0],null,[22,21],[17,0]] },
    'X': { width: 20, points: [[3,21],[17,0],null,[17,21],[3,0]] },
    'Y': { width: 18, points: [[1,21],[9,11],[9,0],null,[17,21],[9,11]] },
    'Z': { width: 20, points: [[17,21],[3,0],null,[3,21],[17,21],null,[3,0],[17,0]] },
    '[': { width: 14, points: [[4,25],[4,-7],null,[5,25],[5,-7],null,[4,25],[11,25],null,[4,-7],[11,-7]] },
    '\\':{ width: 14, points: [[0,21],[14,-3]] },
    ']': { width: 14, points: [[9,25],[9,-7],null,[10,25],[10,-7],null,[3,25],[10,25],null,[3,-7],[10,-7]] },
    '^': { width: 14, points: [[3,10],[8,18],[13,10]] },
    '_': { width: 16, points: [[0,-2],[16,-2]] },
    '`': { width: 10, points: [[6,21],[5,20],[4,18],[4,16],[5,15],[6,16],[5,17]] },
    'a': { width: 19, points: [[15,14],[15,0],null,[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'b': { width: 19, points: [[4,21],[4,0],null,[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
    'c': { width: 18, points: [[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'd': { width: 19, points: [[15,21],[15,0],null,[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'e': { width: 18, points: [[3,8],[15,8],[15,10],[14,12],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'f': { width: 12, points: [[10,21],[8,21],[6,20],[5,17],[5,0],null,[2,14],[9,14]] },
    'g': { width: 19, points: [[15,14],[15,-2],[14,-5],[13,-6],[11,-7],[8,-7],[6,-6],null,[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'h': { width: 19, points: [[4,21],[4,0],null,[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
    'i': { width: 8,  points: [[3,21],[4,20],[5,21],[4,22],[3,21],null,[4,14],[4,0]] },
    'j': { width: 10, points: [[5,21],[6,20],[7,21],[6,22],[5,21],null,[6,14],[6,-3],[5,-6],[3,-7],[1,-7]] },
    'k': { width: 17, points: [[4,21],[4,0],null,[14,14],[4,4],null,[8,8],[15,0]] },
    'l': { width: 8,  points: [[4,21],[4,0]] },
    'm': { width: 30, points: [[4,14],[4,0],null,[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0],null,[15,10],[18,13],[20,14],[23,14],[25,13],[26,10],[26,0]] },
    'n': { width: 19, points: [[4,14],[4,0],null,[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
    'o': { width: 19, points: [[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3],[16,6],[16,8],[15,11],[13,13],[11,14],[8,14]] },
    'p': { width: 19, points: [[4,14],[4,-7],null,[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
    'q': { width: 19, points: [[15,14],[15,-7],null,[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
    'r': { width: 13, points: [[4,14],[4,0],null,[4,8],[5,11],[7,13],[9,14],[12,14]] },
    's': { width: 17, points: [[14,11],[13,13],[10,14],[7,14],[4,13],[3,11],[4,9],[6,8],[11,7],[13,6],[14,4],[14,3],[13,1],[10,0],[7,0],[4,1],[3,3]] },
    't': { width: 12, points: [[5,21],[5,4],[6,1],[8,0],[10,0],null,[2,14],[9,14]] },
    'u': { width: 19, points: [[4,14],[4,4],[5,1],[7,0],[10,0],[12,1],[15,4],null,[15,14],[15,0]] },
    'v': { width: 16, points: [[2,14],[8,0],null,[14,14],[8,0]] },
    'w': { width: 22, points: [[3,14],[7,0],null,[11,14],[7,0],null,[11,14],[15,0],null,[19,14],[15,0]] },
    'x': { width: 17, points: [[3,14],[14,0],null,[14,14],[3,0]] },
    'y': { width: 16, points: [[2,14],[8,0],null,[14,14],[8,0],[6,-4],[4,-6],[2,-7],[1,-7]] },
    'z': { width: 17, points: [[14,14],[3,0],null,[3,14],[14,14],null,[3,0],[14,0]] },
    '{': { width: 14, points: [[9,25],[7,24],[6,23],[5,21],[5,19],[6,17],[7,16],[8,14],[8,12],[6,10],null,[7,24],[6,22],[6,20],[7,18],[8,17],[9,15],[9,13],[8,11],[4,9],[8,7],[9,5],[9,3],[8,1],[7,0],[6,-2],[6,-4],[7,-6],null,[6,8],[8,6],[8,4],[7,2],[6,1],[5,-1],[5,-3],[6,-5],[7,-6],[9,-7]] },
    '|': { width: 8,  points: [[4,25],[4,-7]] },
    '}': { width: 14, points: [[5,25],[7,24],[8,23],[9,21],[9,19],[8,17],[7,16],[6,14],[6,12],[8,10],null,[7,24],[8,22],[8,20],[7,18],[6,17],[5,15],[5,13],[6,11],[10,9],[6,7],[5,5],[5,3],[6,1],[7,0],[8,-2],[8,-4],[7,-6],null,[8,8],[6,6],[6,4],[7,2],[8,1],[9,-1],[9,-3],[8,-5],[7,-6],[5,-7]] },
    '~': { width: 24, points: [[3,6],[3,8],[4,11],[6,12],[8,12],[10,11],[14,8],[16,7],[18,7],[20,8],[21,10],null,[3,8],[4,10],[6,11],[8,11],[10,10],[14,7],[16,6],[18,6],[20,7],[21,10],[21,12]] },
    
    // Lower case Latin-1
    '�': { diacritic: '`', letter: 'a' },
    '�': { diacritic: '�', letter: 'a' },
    '�': { diacritic: '^', letter: 'a' },
    '�': { diacritic: '�', letter: 'a' },
    '�': { diacritic: '~', letter: 'a' },
    
    '�': { diacritic: '`', letter: 'e' },
    '�': { diacritic: '�', letter: 'e' },
    '�': { diacritic: '^', letter: 'e' },
    '�': { diacritic: '�', letter: 'e' },
    
    '�': { diacritic: '`', letter: 'i' },
    '�': { diacritic: '�', letter: 'i' },
    '�': { diacritic: '^', letter: 'i' },
    '�': { diacritic: '�', letter: 'i' },
    
    '�': { diacritic: '`', letter: 'o' },
    '�': { diacritic: '�', letter: 'o' },
    '�': { diacritic: '^', letter: 'o' },
    '�': { diacritic: '�', letter: 'o' },
    '�': { diacritic: '~', letter: 'o' },

    '�': { diacritic: '`', letter: 'u' },
    '�': { diacritic: '�', letter: 'u' },
    '�': { diacritic: '^', letter: 'u' },
    '�': { diacritic: '�', letter: 'u' },
    
    '�': { diacritic: '�', letter: 'y' },
    '�': { diacritic: '�', letter: 'y' },
    
    '�': { diacritic: '�', letter: 'c' },
    '�': { diacritic: '~', letter: 'n' },

    // Upper case Latin-1
    '�': { diacritic: '`', letter: 'A' },
    '�': { diacritic: '�', letter: 'A' },
    '�': { diacritic: '^', letter: 'A' },
    '�': { diacritic: '�', letter: 'A' },
    '�': { diacritic: '~', letter: 'A' },
    
    '�': { diacritic: '`', letter: 'E' },
    '�': { diacritic: '�', letter: 'E' },
    '�': { diacritic: '^', letter: 'E' },
    '�': { diacritic: '�', letter: 'E' },

    '�': { diacritic: '`', letter: 'I' },
    '�': { diacritic: '�', letter: 'I' },
    '�': { diacritic: '^', letter: 'I' },
    '�': { diacritic: '�', letter: 'I' },
    
    '�': { diacritic: '`', letter: 'O' },
    '�': { diacritic: '�', letter: 'O' },
    '�': { diacritic: '^', letter: 'O' },
    '�': { diacritic: '�', letter: 'O' },
    '�': { diacritic: '~', letter: 'O' },
    
    '�': { diacritic: '`', letter: 'U' },
    '�': { diacritic: '�', letter: 'U' },
    '�': { diacritic: '^', letter: 'U' },
    '�': { diacritic: '�', letter: 'U' },
    
    '�': { diacritic: '�', letter: 'Y' },
    
    '�': { diacritic: '�', letter: 'C' },
    '�': { diacritic: '~', letter: 'N' }
  },
  
  specialchars: {
    'pi': { width: 19, points: [[6,14],[6,0],null,[14,14],[14,0],null,[2,13],[6,16],[13,13],[17,16]] }
  },
  
  /** Diacritics, used to draw accentuated letters */
  diacritics: {
    '�': { entity: 'cedil', points: [[6,-4],[4,-6],[2,-7],[1,-7]] },
    '�': { entity: 'acute', points: [[8,19],[13,22]] },
    '`': { entity: 'grave', points: [[7,22],[12,19]] },
    '^': { entity: 'circ',  points: [[5.5,19],[9.5,23],[12.5,19]] },
    '�': { entity: 'trema', points: [[5,21],[6,20],[7,21],[6,22],[5,21],null,[12,21],[13,20],[14,21],[13,22],[12,21]] },
    '~': { entity: 'tilde', points: [[4,18],[7,22],[10,18],[13,22]] }
  },
  
  /** The default font styling */
  style: {
    size: 8,            // font height in pixels
    font: null,         // not yet implemented
    color: '#000000',   // font color
    weight: 1,          // float, 1 for 'normal'
    textAlign: 'left',  // left, right, center
    textBaseline: 'bottom', // top, middle, bottom 
    adjustAlign: false, // modifies the alignments if the angle is different from 0 to make the spin point always at the good position
    angle: 0,           // in radians, anticlockwise
    tracking: 1,        // space between the letters, float, 1 for 'normal'
    boundingBoxColor: '#ff0000', // color of the bounding box (null to hide), can be used for debug and font drawing
    originPointColor: '#000000'  // color of the bounding box (null to hide), can be used for debug and font drawing
  },
  
  debug: false,
  _bufferLexemes: {},

  extend: function(dest, src) {
    for (var property in src) {
      if (property in dest) continue;
      dest[property] = src[property];
    }
    return dest;
  },

  /** Get the letter data corresponding to a char
   * @param {String} ch - The char
   */
  letter: function(ch) {
    return CanvasText.letters[ch];
  },
  
  parseLexemes: function(str) {
    if (CanvasText._bufferLexemes[str]) 
      return CanvasText._bufferLexemes[str];
    
    var i, c, matches = str.match(/&[A-Za-z]{2,5};|\s|./g),
        result = [], chars = [];
        
    for (i = 0; i < matches.length; i++) {
      c = matches[i];
      if (c.length == 1) 
        chars.push(c);
      else {
        var entity = c.substring(1, c.length-1);
        if (CanvasText.specialchars[entity]) 
          chars.push(entity);
        else
          chars = chars.concat(c.toArray());
      }
    }
    for (i = 0; i < chars.length; i++) {
      c = chars[i];
      if (c = CanvasText.letters[c] || CanvasText.specialchars[c]) result.push(c);
    }
    for (i = 0; i < result.length; i++) {
      if (result === null || typeof result === 'undefined') 
      delete result[i];
    }
    return CanvasText._bufferLexemes[str] = result;
  },

  /** Get the font ascent for a given style
   * @param {Object} style - The reference style
   */
  ascent: function(style) {
    style = style || CanvasText.style;
    return (style.size || CanvasText.style.size);
  },
  
  /** Get the font descent for a given style 
   * @param {Object} style - The reference style
   * */
  descent: function(style) {
    style = style || CanvasText.style;
    return 7.0*(style.size || CanvasText.style.size)/25.0;
  },
  
  /** Measure the text horizontal size 
   * @param {String} str - The text
   * @param {Object} style - Text style
   * */
  measure: function(str, style) {
    if (!str) return;
    style = style || CanvasText.style;
    
    var i, width, lexemes = CanvasText.parseLexemes(str),
        total = 0;

    for (i = lexemes.length-1; i > -1; --i) {
      c = lexemes[i];
      width = (c.diacritic) ? CanvasText.letter(c.letter).width : c.width;
      total += width * (style.tracking || CanvasText.style.tracking) * (style.size || CanvasText.style.size) / 25.0;
    }
    return total;
  },
  
  getDimensions: function(str, style) {
    style = style || CanvasText.style;
    
    var width = CanvasText.measure(str, style),
        height = style.size || CanvasText.style.size,
        angle = style.angle || CanvasText.style.angle;

    if (style.angle == 0) return {width: width, height: height};
    return {
      width:  Math.abs(Math.cos(angle) * width) + Math.abs(Math.sin(angle) * height),
      height: Math.abs(Math.sin(angle) * width) + Math.abs(Math.cos(angle) * height)
    }
  },
  
  /** Draws serie of points at given coordinates 
   * @param {Canvas context} ctx - The canvas context
   * @param {Array} points - The points to draw
   * @param {Number} x - The X coordinate
   * @param {Number} y - The Y coordinate
   * @param {Number} mag - The scale 
   */
  drawPoints: function (ctx, points, x, y, mag, offset) {
    var i, a, penUp = true, needStroke = 0;
    offset = offset || {x:0, y:0};
    
    ctx.beginPath();
    for (i = 0; i < points.length; i++) {
      a = points[i];
      if (!a) {
        penUp = true;
        continue;
      }
      if (penUp) {
        ctx.moveTo(x + a[0]*mag + offset.x, y - a[1]*mag + offset.y);
        penUp = false;
      }
      else {
        ctx.lineTo(x + a[0]*mag + offset.x, y - a[1]*mag + offset.y);
      }
    }
    ctx.stroke();
    ctx.closePath();
  },
  
  /** Draws a text at given coordinates and with a given style
   * @param {String} str - The text to draw
   * @param {Number} xOrig - The X coordinate
   * @param {Number} yOrig - The Y coordinate
   * @param {Object} style - The font style
   */
  draw: function(str, xOrig, yOrig, style) {
    if (!str) return;
    CanvasText.extend(style, CanvasText.style);
    
    var i, c, total = 0,
        mag = style.size / 25.0,
        x = 0, y = 0,
        lexemes = CanvasText.parseLexemes(str),
        offset = {x: 0, y: 0}, 
        measure = CanvasText.measure(str, style),
        align;
        
    if (style.adjustAlign) {
      align = CanvasText.getBestAlign(style.angle, style);
      CanvasText.extend(style, align);
    }
        
    switch (style.textAlign) {
      case 'left': break;
      case 'center': offset.x = -measure / 2; break;
      case 'right':  offset.x = -measure; break;
    }
    
    switch (style.textBaseline) {
      case 'bottom': break;
      case 'middle': offset.y = style.size / 2; break;
      case 'top':    offset.y = style.size; break;
    }
    
    this.save();
    this.translate(xOrig, yOrig);
    this.rotate(style.angle);
    this.lineCap = "round";
    this.lineWidth = 2.0 * mag * (style.weight || CanvasText.style.weight);
    this.strokeStyle = style.color || CanvasText.style.color;
    
    for (i = 0; i < lexemes.length; i++) {
      c = lexemes[i];
      if (c.width == -1) {
        x = 0;
        y = style.size * 1.4;
        continue;
      }
    
      var points = c.points,
          width = c.width;
          
      if (c.diacritic) {
        var dia = CanvasText.diacritics[c.diacritic],
            character = CanvasText.letter(c.letter);

        CanvasText.drawPoints(this, dia.points, x, y - (c.letter.toUpperCase() == c.letter ? 3 : 0), mag, offset);
        points = character.points;
        width = character.width;
      }

      CanvasText.drawPoints(this, points, x, y, mag, offset);
      
      if (CanvasText.debug) {
        this.save();
        this.lineJoin = "miter";
        this.lineWidth = 0.5;
        this.strokeStyle = (style.boundingBoxColor || CanvasText.style.boundingBoxColor);
        this.strokeRect(x+offset.x, y+offset.y, width*mag, -style.size);
        
        this.fillStyle = (style.originPointColor || CanvasText.style.originPointColor);
        this.beginPath();
        this.arc(0, 0, 1.5, 0, Math.PI*2, true);
        this.fill();
        this.closePath();
        this.restore();
      }
      
      x += width*mag*(style.tracking || CanvasText.style.tracking);
    }
    this.restore();
    return total;
  }
};

/** The text functions are bound to the CanvasRenderingContext2D prototype */
CanvasText.proto = window.CanvasRenderingContext2D ? window.CanvasRenderingContext2D.prototype : document.createElement('canvas').getContext('2d').__proto__;

if (CanvasText.proto) {
  CanvasText.proto.drawText      = CanvasText.draw;
  CanvasText.proto.measure       = CanvasText.measure;
  CanvasText.proto.getTextBounds = CanvasText.getDimensions;
  CanvasText.proto.fontAscent    = CanvasText.ascent;
  CanvasText.proto.fontDescent   = CanvasText.descent;
}/** 
 * @projectDescription Flotr is a javascript plotting library based on the Prototype Javascript Framework.
 * @author Bas Wenneker
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 * @version 0.2.0
 */

var Flotr = {
  version: "0.2.0-alpha",
  revision: ('$Revision: 192 $'.match(/(\d+)/) || [null,null])[1],
  author: ['Bas Wenneker', 'Fabien Ménager'],
  website: 'http://www.solutoire.com',
  isIphone: /iphone/i.test(navigator.userAgent),
  isIE: (navigator.appVersion.indexOf("MSIE") != -1 ? parseFloat(navigator.appVersion.split("MSIE")[1]) : false),
  
  /**
   * An object of the registered graph types. Use Flotr.addType(type, object)
   * to add your own type.
   */
  graphTypes: {},
  
  /**
   * The list of the registered plugins
   */
  plugins: {},
  
  /**
   * Can be used to add your own chart type. 
   * @param {String} name - Type of chart, like 'pies', 'bars' etc.
   * @param {String} graphType - The object containing the basic drawing functions (draw, etc)
   */
  addType: function(name, graphType){
    Flotr.graphTypes[name] = graphType;
    Flotr.defaultOptions[name] = graphType.options || {};
    Flotr.defaultOptions.defaultType = Flotr.defaultOptions.defaultType || name;
  },
  
  /**
   * Can be used to add a plugin
   * @param {String} name - The name of the plugin
   * @param {String} plugin - The object containing the plugin's data (callbacks, options, function1, function2, ...)
   */
  addPlugin: function(name, plugin){
    Flotr.plugins[name] = plugin;
    Flotr.defaultOptions[name] = plugin.options || {};
  },
  
  /**
   * Draws the graph. This function is here for backwards compatibility with Flotr version 0.1.0alpha.
   * You could also draw graphs by directly calling Flotr.Graph(element, data, options).
   * @param {Element} el - element to insert the graph into
   * @param {Object} data - an array or object of dataseries
   * @param {Object} options - an object containing options
   * @param {Class} _GraphKlass_ - (optional) Class to pass the arguments to, defaults to Flotr.Graph
   * @return {Object} returns a new graph object and of course draws the graph.
   */
  draw: function(el, data, options, GraphKlass){  
    GraphKlass = GraphKlass || Flotr.Graph;
    return new GraphKlass(el, data, options);
  },
  
  /**
   * Collects dataseries from input and parses the series into the right format. It returns an Array 
   * of Objects each having at least the 'data' key set.
   * @param {Array, Object} data - Object or array of dataseries
   * @return {Array} Array of Objects parsed into the right format ({(...,) data: [[x1,y1], [x2,y2], ...] (, ...)})
   */
  getSeries: function(data){
    return _.map(data, function(serie){
      serie = (serie.data) ? _.clone(serie) : {data: serie};
      for (var i = serie.data.length-1; i > -1; --i) {
        serie.data[i][1] = (serie.data[i][1] === null ? null : parseFloat(serie.data[i][1])); 
      }
      return serie;
    });
  },
  
  /**
   * Recursively merges two objects.
   * @param {Object} src - source object (likely the object with the least properties)
   * @param {Object} dest - destination object (optional, object with the most properties)
   * @return {Object} recursively merged Object
   * @TODO See if we can't remove this.
   */
  merge: function(src, dest){
    var i, v, result = dest || {};
    for(i in src){
      v = src[i];
      result[i] = (v && typeof(v) === 'object' && !(v.constructor === Array || v.constructor === RegExp) && !_.isElement(v)) ? Flotr.merge(v, dest[i]) : result[i] = v;
    }
    return result;
  },
  
  /**
   * Recursively clones an object.
   * @param {Object} object - The object to clone
   * @return {Object} the clone
   * @TODO See if we can't remove this.
   */
  clone: function(object){
    var i, v, clone = {};
    for(i in object){
      v = object[i];
      clone[i] = (v && typeof(v) === 'object' && !(v.constructor === Array || v.constructor === RegExp) && !_.isElement(v)) ? Flotr.clone(v) : v;
    }
    return clone;
  },
  
  /**
   * Function calculates the ticksize and returns it.
   * @param {Integer} noTicks - number of ticks
   * @param {Integer} min - lower bound integer value for the current axis
   * @param {Integer} max - upper bound integer value for the current axis
   * @param {Integer} decimals - number of decimals for the ticks
   * @return {Integer} returns the ticksize in pixels
   */
  getTickSize: function(noTicks, min, max, decimals){
    var delta = (max - min) / noTicks,
        magn = Flotr.getMagnitude(delta),
        tickSize = 10,
        norm = delta / magn; // Norm is between 1.0 and 10.0.
        
    if(norm < 1.5) tickSize = 1;
    else if(norm < 2.25) tickSize = 2;
    else if(norm < 3) tickSize = ((decimals == 0) ? 2 : 2.5);
    else if(norm < 7.5) tickSize = 5;
    
    return tickSize * magn;
  },
  
  /**
   * Default tick formatter.
   * @param {String, Integer} val - tick value integer
   * @return {String} formatted tick string
   */
  defaultTickFormatter: function(val){
    return val+'';
  },
  
  /**
   * Formats the mouse tracker values.
   * @param {Object} obj - Track value Object {x:..,y:..}
   * @return {String} Formatted track string
   */
  defaultTrackFormatter: function(obj){
    return '('+obj.x+', '+obj.y+')';
  }, 
  
  /**
   * Utility function to convert file size values in bytes to kB, MB, ...
   * @param value {Number} - The value to convert
   * @param precision {Number} - The number of digits after the comma (default: 2)
   * @param base {Number} - The base (default: 1000)
   */
  engineeringNotation: function(value, precision, base){
    var sizes =         ['Y','Z','E','P','T','G','M','k',''],
        fractionSizes = ['y','z','a','f','p','n','µ','m',''],
        total = sizes.length;

    base = base || 1000;
    precision = Math.pow(10, precision || 2);

    if (value == 0) return 0;

    if (value > 1) {
      while (total-- && (value >= base)) value /= base;
    }
    else {
      sizes = fractionSizes;
      total = sizes.length;
      while (total-- && (value < 1)) value *= base;
    }

    return (Math.round(value * precision) / precision) + sizes[total];
  },
  
  /**
   * Returns the magnitude of the input value.
   * @param {Integer, Float} x - integer or float value
   * @return {Integer, Float} returns the magnitude of the input value
   */
  getMagnitude: function(x){
    return Math.pow(10, Math.floor(Math.log(x) / Math.LN10));
  },
  toPixel: function(val){
    return Math.floor(val)+0.5;//((val-Math.round(val) < 0.4) ? (Math.floor(val)-0.5) : val);
  },
  toRad: function(angle){
    return -angle * (Math.PI/180);
  },
  floorInBase: function(n, base) {
    return base * Math.floor(n / base);
  },
  drawText: function(ctx, text, x, y, style) {
    if (!ctx.fillText || Flotr.isIphone) {
      ctx.drawText(text, x, y, style);
      return;
    }
    
    style = _.extend({
      size: Flotr.defaultOptions.fontSize,
      color: '#000000',
      textAlign: 'left',
      textBaseline: 'bottom',
      weight: 1,
      angle: 0
    }, style);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(style.angle);
    ctx.fillStyle = style.color;
    ctx.font = (style.weight > 1 ? "bold " : "") + (style.size*1.3) + "px sans-serif";
    ctx.textAlign = style.textAlign;
    ctx.textBaseline = style.textBaseline;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  },
  measureText: function(ctx, text, style) {
    if (!ctx.fillText || Flotr.isIphone) {
      return {width: ctx.measure(text, style)};
    }
    
    style = _.extend({
      size: Flotr.defaultOptions.fontSize,
      weight: 1,
      angle: 0
    }, style);
    
    ctx.save();
    ctx.rotate(style.angle);
    ctx.font = (style.weight > 1 ? "bold " : "") + (style.size*1.3) + "px sans-serif";
    var metrics = ctx.measureText(text);
    ctx.restore();
    return metrics;
  },
  getBestTextAlign: function(angle, style) {
    style = style || {textAlign: 'center', textBaseline: 'middle'};
    angle += Flotr.getTextAngleFromAlign(style);
    
    if (Math.abs(Math.cos(angle)) > 10e-3) 
      style.textAlign    = (Math.cos(angle) > 0 ? 'right' : 'left');
    
    if (Math.abs(Math.sin(angle)) > 10e-3) 
      style.textBaseline = (Math.sin(angle) > 0 ? 'top' : 'bottom');
    
    return style;
  },
  alignTable: {
    'right middle' : 0,
    'right top'    : Math.PI/4,
    'center top'   : Math.PI/2,
    'left top'     : 3*(Math.PI/4),
    'left middle'  : Math.PI,
    'left bottom'  : -3*(Math.PI/4),
    'center bottom': -Math.PI/2,
    'right bottom' : -Math.PI/4,
    'center middle': 0
  },
  getTextAngleFromAlign: function(style) {
    return Flotr.alignTable[style.textAlign+' '+style.textBaseline] || 0;
  }
};

/**
 * Flotr Defaults
 */
Flotr.defaultOptions = {
  colors: ['#00A8F0', '#C0D800', '#CB4B4B', '#4DA74D', '#9440ED'], //=> The default colorscheme. When there are > 5 series, additional colors are generated.
  title: null,             // => The graph's title
  subtitle: null,          // => The graph's subtitle
  shadowSize: 4,           // => size of the 'fake' shadow
  defaultType: null,       // => default series type
  HtmlText: true,          // => wether to draw the text using HTML or on the canvas
  fontSize: 7.5,           // => canvas' text font size
  resolution: 1,           // => resolution of the graph, to have printer-friendly graphs !
  xaxis: {
    ticks: null,           // => format: either [1, 3] or [[1, 'a'], 3]
    minorTicks: null,      // => format: either [1, 3] or [[1, 'a'], 3]
    showLabels: true,      // => setting to true will show the axis ticks labels, hide otherwise
    showMinorLabels: false,// => true to show the axis minor ticks labels, false to hide
    labelsAngle: 0,        // => labels' angle, in degrees
    title: null,           // => axis title
    titleAngle: 0,         // => axis title's angle, in degrees
    noTicks: 5,            // => number of ticks for automagically generated ticks
    minorTickFreq: null,   // => number of minor ticks between major ticks for autogenerated ticks
    tickFormatter: Flotr.defaultTickFormatter, // => fn: number -> string
    tickDecimals: null,    // => no. of decimals, null means auto
    min: null,             // => min. value to show, null means set automatically
    max: null,             // => max. value to show, null means set automatically
    autoscale: false,      // => Turns autoscaling on with true
    autoscaleMargin: 0,    // => margin in % to add if auto-setting min/max
    color: null,           // => color of the ticks
    mode: 'normal',        // => can be 'time' or 'normal'
    timeFormat: null,
    scaling: 'linear',     // => Scaling, can be 'linear' or 'logarithmic'
    base: Math.E,
    titleAlign: 'center',
    margin: true           // => Turn off margins with false
  },
  x2axis: {},
  yaxis: {
    ticks: null,           // => format: either [1, 3] or [[1, 'a'], 3]
    minorTicks: null,      // => format: either [1, 3] or [[1, 'a'], 3]
    showLabels: true,      // => setting to true will show the axis ticks labels, hide otherwise
    showMinorLabels: false,// => true to show the axis minor ticks labels, false to hide
    labelsAngle: 0,        // => labels' angle, in degrees
    title: null,           // => axis title
    titleAngle: 90,        // => axis title's angle, in degrees
    noTicks: 5,            // => number of ticks for automagically generated ticks
    minorTickFreq: null,   // => number of minor ticks between major ticks for autogenerated ticks
    tickFormatter: Flotr.defaultTickFormatter, // => fn: number -> string
    tickDecimals: null,    // => no. of decimals, null means auto
    min: null,             // => min. value to show, null means set automatically
    max: null,             // => max. value to show, null means set automatically
    autoscale: false,      // => Turns autoscaling on with true
    autoscaleMargin: 0,    // => margin in % to add if auto-setting min/max
    color: null,           // => The color of the ticks
    scaling: 'linear',     // => Scaling, can be 'linear' or 'logarithmic'
    base: Math.E,
    titleAlign: 'center',
    margin: true           // => Turn off margins with false
  },
  y2axis: {
    titleAngle: 270
  },
  grid: {
    color: '#545454',      // => primary color used for outline and labels
    backgroundColor: null, // => null for transparent, else color
    backgroundImage: null, // => background image. String or object with src, left and top
    watermarkAlpha: 0.4,   // => 
    tickColor: '#DDDDDD',  // => color used for the ticks
    labelMargin: 3,        // => margin in pixels
    verticalLines: true,   // => whether to show gridlines in vertical direction
    minorVerticalLines: null, // => whether to show gridlines for minor ticks in vertical dir.
    horizontalLines: true, // => whether to show gridlines in horizontal direction
    minorHorizontalLines: null, // => whether to show gridlines for minor ticks in horizontal dir.
    outlineWidth: 2,       // => width of the grid outline/border in pixels
    circular: false        // => if set to true, the grid will be circular, must be used when radars are drawn
  },
  selection: {
    mode: null,            // => one of null, 'x', 'y' or 'xy'
    color: '#B6D9FF',      // => selection box color
    fps: 20                // => frames-per-second
  },
  crosshair: {
    mode: null,            // => one of null, 'x', 'y' or 'xy'
    color: '#FF0000',      // => crosshair color
    hideCursor: true       // => hide the cursor when the crosshair is shown
  },
  mouse: {
    track: false,          // => true to track the mouse, no tracking otherwise
    trackAll: false,
    position: 'se',        // => position of the value box (default south-east)
    relative: false,       // => next to the mouse cursor
    trackFormatter: Flotr.defaultTrackFormatter, // => formats the values in the value box
    margin: 5,             // => margin in pixels of the valuebox
    lineColor: '#FF3F19',  // => line color of points that are drawn when mouse comes near a value of a series
    trackDecimals: 1,      // => decimals for the track values
    sensibility: 2,        // => the lower this number, the more precise you have to aim to show a value
    trackY: true,          // => whether or not to track the mouse in the y axis
    radius: 3,             // => radius of the track point
    fillColor: null,       // => color to fill our select bar with only applies to bar and similar graphs (only bars for now)
    fillOpacity: 0.4       // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill 
  }
};

Flotr.DOM = {
  addClass: function(element, name){
    var classList = (element.className ? element.className : '');
      if (_.include(classList.split(/\s+/g), name)) return;
    element.className = (classList ? classList + ' ' : '') + name;
  },
  /**
   * Create an element.
   */
  create: function(tag){
    return document.createElement(tag);
  },
  node: function(html) {
    var div = Flotr.DOM.create('div'), n;
    div.innerHTML = html;
    n = div.children[0];
    div.innerHTML = '';
    return n;
  },
  /**
   * Remove all children.
   */
  empty: function(element){
    element.innerHTML = '';
    /*
    if (!element) return;
    _.each(element.childNodes, function (e) {
      Flotr.DOM.empty(e);
      element.removeChild(e);
    });
    */
  },
  hide: function(element){
    Flotr.DOM.setStyles(element, {display:'none'});
  },
  /**
   * Insert a child.
   * @param {Element} element
   * @param {Element|String} Element or string to be appended.
   */
  insert: function(element, child){
    if(_.isString(child))
      element.innerHTML += child;
    else if (_.isElement(child))
      element.appendChild(child);
  },
  // @TODO find xbrowser implementation
  opacity: function(element, opacity) {
    element.style.opacity = opacity;
  },
  position: function(element, p){
    if (!element.offsetParent)
      return {left: (element.offsetLeft || 0), top: (element.offsetTop || 0)};
    p = this.position(element.offsetParent);
    p.left += element.offsetLeft;
    p.top += element.offsetTop;
    return p;
  },
  removeClass: function(element, name) {
    var classList = (element.className ? element.className : '');
    element.className = _.filter(classList.split(/\s+/g), function (c) {
      if (c != name) return true; }
    ).join(' ');
  },
  setStyles: function(element, o) {
    _.each(o, function (value, key) {
      element.style[key] = value;
    });
  },
  show: function(element){
    Flotr.DOM.setStyles(element, {display:''});
  },
  /**
   * Return element size.
   */
  size: function(element){
    return {
      height : element.scrollHeight,
      width: element.scrollWidth };
  }
};

/**
 * Flotr Event Adapter
 */
Flotr.EventAdapter = {
  observe: function(object, name, callback) {
    bean.add(object, name, callback);
    return this;
  },
  fire: function(object, name, args) {
    bean.fire(object, name, args);
    if (typeof(Prototype) != 'undefined')
      Event.fire(object, name, args);
    // @TODO Someone who uses mootools, add mootools adapter for existing applciations.
    return this;
  },
  stopObserving: function(object, name, callback) {
    bean.remove(object, name, callback);
    return this;
  }
};

/**
 * Flotr Color
 */

(function () {

// Constructor
Flotr.Color = function(r, g, b, a){
  this.rgba = ['r','g','b','a'];
  var x = 4;
  while(-1<--x){
    this[this.rgba[x]] = arguments[x] || ((x==3) ? 1.0 : 0);
  }
  this.normalize();
};

// Constants
var COLOR_NAMES = {
  aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],
  brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],
  darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],
  darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],
  darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],
  khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],
  lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],
  maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],
  violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]
};

Flotr.Color.prototype = {
  adjust: function(rd, gd, bd, ad) {
    var x = 4;
    while(-1<--x){
      if(arguments[x] != null)
        this[this.rgba[x]] += arguments[x];
    }
    return this.normalize();
  },
  scale: function(rf, gf, bf, af){
    var x = 4;
    while(-1<--x){
      if(arguments[x] != null)
        this[this.rgba[x]] *= arguments[x];
    }
    return this.normalize();
  },
  clone: function(){
    return new Flotr.Color(this.r, this.b, this.g, this.a);
  },
  limit: function(val,minVal,maxVal){
    return Math.max(Math.min(val, maxVal), minVal);
  },
  normalize: function(){
    var limit = this.limit;
    this.r = limit(parseInt(this.r), 0, 255);
    this.g = limit(parseInt(this.g), 0, 255);
    this.b = limit(parseInt(this.b), 0, 255);
    this.a = limit(this.a, 0, 1);
    return this;
  },
  distance: function(color){
    if (!color) return;
    color = new Flotr.Color.parse(color);
    var dist = 0, x = 3;
    while(-1<--x){
      dist += Math.abs(this[this.rgba[x]] - color[this.rgba[x]]);
    }
    return dist;
  },
  toString: function(){
    return (this.a >= 1.0) ? 'rgb('+[this.r,this.g,this.b].join(',')+')' : 'rgba('+[this.r,this.g,this.b,this.a].join(',')+')';
  }
};

_.extend(Flotr.Color, {
  /**
   * Parses a color string and returns a corresponding Color.
   * The different tests are in order of probability to improve speed.
   * @param {String, Color} str - string thats representing a color
   * @return {Color} returns a Color object or false
   */
  parse: function(color){
    if (color instanceof Flotr.Color) return color;

    var result, Color = Flotr.Color;

    // #a0b1c2
    if((result = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(color)))
      return new Color(parseInt(result[1],16), parseInt(result[2],16), parseInt(result[3],16));

    // rgb(num,num,num)
    if((result = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(color)))
      return new Color(parseInt(result[1]), parseInt(result[2]), parseInt(result[3]));
  
    // #fff
    if((result = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(color)))
      return new Color(parseInt(result[1]+result[1],16), parseInt(result[2]+result[2],16), parseInt(result[3]+result[3],16));
  
    // rgba(num,num,num,num)
    if((result = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(color)))
      return new Color(parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseFloat(result[4]));
      
    // rgb(num%,num%,num%)
    if((result = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(color)))
      return new Color(parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55);
  
    // rgba(num%,num%,num%,num)
    if((result = /rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(color)))
      return new Color(parseFloat(result[1])*2.55, parseFloat(result[2])*2.55, parseFloat(result[3])*2.55, parseFloat(result[4]));

    // Otherwise, we're most likely dealing with a named color.
    var name = (color+'').replace(/^\s*([\S\s]*?)\s*$/, '$1').toLowerCase();
    if(name == 'transparent'){
      return new Color(255, 255, 255, 0);
    }
    return (result = COLOR_NAMES[name]) ? new Color(result[0], result[1], result[2]) : new Color(0, 0, 0, 0);
  },

  /**
   * Process color and options into color style.
   */
  processColor: function(color, options) {

    if (!color) return 'rgba(0, 0, 0, 0)';
    if (color instanceof Flotr.Color) return color.adjust(null, null, null, options.opacity).toString();
    if (_.isString(color)) return Flotr.Color.parse(color).scale(null, null, null, options.opacity).toString();
    
    var grad = color.colors ? color : {colors: color};
    
    if (!options.ctx) {
      if (!_.isArray(grad.colors)) return 'rgba(0, 0, 0, 0)';
      return Flotr.Color.parse(_.isArray(grad.colors[0]) ? grad.colors[0][1] : grad.colors[0]).scale(null, null, null, options.opacity).toString();
    }
    grad = _.extend({start: 'top', end: 'bottom'}, grad); 
    
    if (/top/i.test(grad.start))  options.x1 = 0;
    if (/left/i.test(grad.start)) options.y1 = 0;
    if (/bottom/i.test(grad.end)) options.x2 = 0;
    if (/right/i.test(grad.end))  options.y2 = 0;

    var i, c, stop, gradient = options.ctx.createLinearGradient(options.x1, options.y1, options.x2, options.y2);
    for (i = 0; i < grad.colors.length; i++) {
      c = grad.colors[i];
      if (_.isArray(c)) {
        stop = c[0];
        c = c[1];
      }
      else stop = i / (grad.colors.length-1);
      gradient.addColorStop(stop, Flotr.Color.parse(c).scale(null, null, null, options.opacity));
    }
    return gradient;
  },
  
  /**
   * Extracts the background-color of the passed element.
   * @param {Element} element - The element from what the background color is extracted
   * @return {String} color string
   */
  extract: function(element){
    var color;
    // Loop until we find an element with a background color and stop when we hit the body element. 
    do {
      color = element.getStyle('background-color').toLowerCase();
      if(!(color == '' || color == 'transparent')) break;
      element = element.up();
    } while(!element.nodeName.match(/^body$/i));

    // Catch Safari's way of signaling transparent.
    return new Flotr.Color(color == 'rgba(0, 0, 0, 0)' ? 'transparent' : color);
  }
});
})();

/**
 * Flotr Date
 */
Flotr.Date = {
  format: function(d, format) {
    if (!d) return;
    
    // We should maybe use an "official" date format spec, like PHP date() or ColdFusion 
    // http://fr.php.net/manual/en/function.date.php
    // http://livedocs.adobe.com/coldfusion/8/htmldocs/help.html?content=functions_c-d_29.html
    var tokens = {
      h: d.getUTCHours().toString(),
      H: leftPad(d.getUTCHours()),
      M: leftPad(d.getUTCMinutes()),
      S: leftPad(d.getUTCSeconds()),
      s: d.getUTCMilliseconds(),
      d: d.getUTCDate().toString(),
      m: (d.getUTCMonth() + 1).toString(),
      y: d.getUTCFullYear().toString(),
      b: Flotr.Date.monthNames[d.getUTCMonth()]
    };

    function leftPad(n){
      n += '';
      return n.length == 1 ? "0" + n : n;
    }
    
    var r = [], c,
        escape = false;
    
    for (var i = 0; i < format.length; ++i) {
      c = format.charAt(i);
      
      if (escape) {
        r.push(tokens[c] || c);
        escape = false;
      }
      else if (c == "%")
        escape = true;
      else
        r.push(c);
    }
    return r.join('');
  },
  getFormat: function(time, span) {
    var tu = Flotr.Date.timeUnits;
         if (time < tu.second) return "%h:%M:%S.%s";
    else if (time < tu.minute) return "%h:%M:%S";
    else if (time < tu.day)    return (span < 2 * tu.day) ? "%h:%M" : "%b %d %h:%M";
    else if (time < tu.month)  return "%b %d";
    else if (time < tu.year)   return (span < tu.year) ? "%b" : "%b %y";
    else                       return "%y";
  },
  formatter: function (v, axis) {
    var d = new Date(v);

    // first check global format
    if (axis.options.timeFormat != null)
      return Flotr.Date.format(d, axis.options.timeFormat);
    
    var span = axis.max - axis.min,
        t = axis.tickSize * Flotr.Date.timeUnits[axis.tickUnit];
        
    return Flotr.Date.format(d, Flotr.Date.getFormat(t, span));
  },
  generator: function(axis) {
    var ticks = [],
      d = new Date(axis.min),
      tu = Flotr.Date.timeUnits;
    
    var step = axis.tickSize * tu[axis.tickUnit];

    switch (axis.tickUnit) {
      case "millisecond": d.setUTCMilliseconds(Flotr.floorInBase(d.getUTCMilliseconds(), axis.tickSize)); break;
      case "second": d.setUTCSeconds(Flotr.floorInBase(d.getUTCSeconds(), axis.tickSize)); break;
      case "minute": d.setUTCMinutes(Flotr.floorInBase(d.getUTCMinutes(), axis.tickSize)); break;
      case "hour":   d.setUTCHours(Flotr.floorInBase(d.getUTCHours(), axis.tickSize)); break;
      case "month":  d.setUTCMonth(Flotr.floorInBase(d.getUTCMonth(), axis.tickSize)); break;
      case "year":   d.setUTCFullYear(Flotr.floorInBase(d.getUTCFullYear(), axis.tickSize));break;
    }
    
    // reset smaller components
    if (step >= tu.second)  d.setUTCMilliseconds(0);
    if (step >= tu.minute)  d.setUTCSeconds(0);
    if (step >= tu.hour)    d.setUTCMinutes(0);
    if (step >= tu.day)     d.setUTCHours(0);
    if (step >= tu.day * 4) d.setUTCDate(1);
    if (step >= tu.year)    d.setUTCMonth(0);

    var carry = 0, v = Number.NaN, prev;
    do {
      prev = v;
      v = d.getTime();
      ticks.push({ v:v, label:Flotr.Date.formatter(v, axis) });
      if (axis.tickUnit == "month") {
        if (axis.tickSize < 1) {
          /* a bit complicated - we'll divide the month up but we need to take care of fractions
           so we don't end up in the middle of a day */
          d.setUTCDate(1);
          var start = d.getTime();
          d.setUTCMonth(d.getUTCMonth() + 1);
          var end = d.getTime();
          d.setTime(v + carry * tu.hour + (end - start) * axis.tickSize);
          carry = d.getUTCHours();
          d.setUTCHours(0);
        }
        else
          d.setUTCMonth(d.getUTCMonth() + axis.tickSize);
      }
      else if (axis.tickUnit == "year") {
        d.setUTCFullYear(d.getUTCFullYear() + axis.tickSize);
      }
      else
        d.setTime(v + step);

    } while (v < axis.max && v != prev);
    
    return ticks;
  },
  timeUnits: {
    millisecond: 1,
    second: 1000,
    minute: 1000 * 60,
    hour:   1000 * 60 * 60,
    day:    1000 * 60 * 60 * 24,
    month:  1000 * 60 * 60 * 24 * 30,
    year:   1000 * 60 * 60 * 24 * 365.2425
  },
  // the allowed tick sizes, after 1 year we use an integer algorithm
  spec: [
    [1, "millisecond"], [20, "millisecond"], [50, "millisecond"], [100, "millisecond"], [200, "millisecond"], [500, "millisecond"], 
    [1, "second"],   [2, "second"],  [5, "second"], [10, "second"], [30, "second"], 
    [1, "minute"],   [2, "minute"],  [5, "minute"], [10, "minute"], [30, "minute"], 
    [1, "hour"],     [2, "hour"],    [4, "hour"],   [8, "hour"],    [12, "hour"],
    [1, "day"],      [2, "day"],     [3, "day"],
    [0.25, "month"], [0.5, "month"], [1, "month"],  [2, "month"],   [3, "month"], [6, "month"],
    [1, "year"]
  ],
  monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};

/**
 * Flotr Graph class that plots a graph on creation.
 */
(function () {

  var D = Flotr.DOM;

  function eventPointer(e) {
    if (Flotr.isIE && Flotr.isIE < 9) {
      return {x: e.clientX + document.body.scrollLeft, y: e.clientY + document.body.scrollTop};
    } else {
      return {x: e.pageX, y: e.pageY};
    }
  }

/**
 * Flotr Graph constructor.
 * @param {Element} el - element to insert the graph into
 * @param {Object} data - an array or object of dataseries
 * @param {Object} options - an object containing options
 */
Flotr.Graph = function(el, data, options){
  try {
  this.el = el;
  
  if (!this.el) throw 'The target container doesn\'t exist';
  if (!this.el.clientWidth) throw 'The target container must be visible';

  this.registerPlugins();
  
  Flotr.EventAdapter.fire(this.el, 'flotr:beforeinit', [this]);
  
  // Initialize some variables
  this.el.graph = this;
  this.data = data;
  this.lastMousePos = { pageX: null, pageY: null };
  this.selection = { first: { x: -1, y: -1}, second: { x: -1, y: -1} };
  this.plotOffset = {left: 0, right: 0, top: 0, bottom: 0};
  this.prevSelection = null;
  this.selectionInterval = null;
  this.ignoreClick = false;   
  this.prevHit = null;
  this.series = Flotr.getSeries(data);
  this.setOptions(options);
  
  // Init graph types
  var type, p;
  for (type in Flotr.graphTypes) {
    this[type] = _.clone(Flotr.graphTypes[type]);
    for (p in this[type]) {
      if (_.isFunction(this[type][p]))
        this[type][p] = _.bind(this[type][p], this);
    }
  }
  
  // Create and prepare canvas.
  this.constructCanvas();
  
  Flotr.EventAdapter.fire(this.el, 'flotr:afterconstruct', [this]);
  
  // Add event handlers for mouse tracking, clicking and selection
  this.initEvents();
  
  this.findDataRanges();
  this.calculateTicks(this.axes.x);
  this.calculateTicks(this.axes.x2);
  this.calculateTicks(this.axes.y);
  this.calculateTicks(this.axes.y2);
  
  this.calculateSpacing();
  this.setupAxes();
  
  this.draw(_.bind(function() {
    Flotr.EventAdapter.fire(this.el, 'flotr:afterinit', [this]);
  }, this));
  } catch (e) {
    try {
      console.error(e);
    } catch (e2) {}
  }
};

Flotr.Graph.prototype = {
  /**
   * Sets options and initializes some variables and color specific values, used by the constructor. 
   * @param {Object} opts - options object
   */
  setOptions: function(opts){
    var options = Flotr.clone(Flotr.defaultOptions);
    options.x2axis = _.extend(_.clone(options.xaxis), options.x2axis);
    options.y2axis = _.extend(_.clone(options.yaxis), options.y2axis);
    this.options = Flotr.merge(opts || {}, options);
    
    // The 4 axes of the plot
    this.axes = {
      x:  {options: this.options.xaxis,  n: 1}, 
      x2: {options: this.options.x2axis, n: 2}, 
      y:  {options: this.options.yaxis,  n: 1}, 
      y2: {options: this.options.y2axis, n: 2}
    };
    
    if (this.options.grid.minorVerticalLines === null && 
      this.options.xaxis.scaling === 'logarithmic') {
      this.options.grid.minorVerticalLines = true;
    }
    if (this.options.grid.minorHorizontalLines === null && 
      this.options.yaxis.scaling === 'logarithmic') {
      this.options.grid.minorHorizontalLines = true;
    }
    
    // Initialize some variables used throughout this function.
    var assignedColors = [],
        colors = [],
        ln = this.series.length,
        neededColors = this.series.length,
        oc = this.options.colors, 
        usedColors = [],
        variation = 0,
        c, i, j, s;

    // Collect user-defined colors from series.
    for(i = neededColors - 1; i > -1; --i){
      c = this.series[i].color;
      if(c){
        --neededColors;
        if(_.isNumber(c)) assignedColors.push(c);
        else usedColors.push(Flotr.Color.parse(c));
      }
    }
    
    // Calculate the number of colors that need to be generated.
    for(i = assignedColors.length - 1; i > -1; --i)
      neededColors = Math.max(neededColors, assignedColors[i] + 1);

    // Generate needed number of colors.
    for(i = 0; colors.length < neededColors;){
      c = (oc.length == i) ? new Flotr.Color(100, 100, 100) : Flotr.Color.parse(oc[i]);
      
      // Make sure each serie gets a different color.
      var sign = variation % 2 == 1 ? -1 : 1,
          factor = 1 + sign * Math.ceil(variation / 2) * 0.2;
      c.scale(factor, factor, factor);

      /**
       * @todo if we're getting too close to something else, we should probably skip this one
       */
      colors.push(c);
      
      if(++i >= oc.length){
        i = 0;
        ++variation;
      }
    }
  
    // Fill the options with the generated colors.
    for(i = 0, j = 0; i < ln; ++i){
      s = this.series[i];

      // Assign the color.
      if(s.color == null){
        s.color = colors[j++].toString();
      }else if(_.isNumber(s.color)){
        s.color = colors[s.color].toString();
      }
      
      // Every series needs an axis
      if (!s.xaxis) s.xaxis = this.axes.x;
           if (s.xaxis == 1) s.xaxis = this.axes.x;
      else if (s.xaxis == 2) s.xaxis = this.axes.x2;
      
      if (!s.yaxis) s.yaxis = this.axes.y;
           if (s.yaxis == 1) s.yaxis = this.axes.y;
      else if (s.yaxis == 2) s.yaxis = this.axes.y2;
      
      // Apply missing options to the series.
      for (var t in Flotr.graphTypes){
        s[t] = _.extend(_.clone(this.options[t]), s[t]);
      }
      s.mouse = _.extend(_.clone(this.options.mouse), s.mouse);
      
      if(s.shadowSize == null) s.shadowSize = this.options.shadowSize;
    }
  },
  /**
   * Get graph type for a series
   * @param {Object} series - the series
   * @return {Object} the graph type
   */
  getType: function(series){
    var t = (series && series.type) ? series.type : this.options.defaultType;
    return this[t];
  },
  /**
   * Try a method on a graph type.  If the method exists, execute it.
   * @param {Object} series
   * @param {String} method  Method name.
   * @param {Array} args  Arguments applied to method.
   * @return executed successfully or failed.
   */
  executeOnType: function(s, method, args){
    var success = false;
    if (!_.isArray(s)) s = [s];

    function e(s) {
      _.each(_.keys(Flotr.graphTypes), function (type) {
        if (s[type] && s[type].show) {
          try {
            if (!_.isUndefined(args))
                this[type][method].apply(this[type], args);
            else
                this[type][method].apply(this[type]);
            success = true;
          } catch (e) {}
        }
      }, this);
    }
    _.each(s, e, this);

    return success;
  },
  setupAxes: function(){
    /**
     * Translates data number to pixel number
     * @param {Number} v - data number
     * @return {Number} translated pixel number
     */
    function d2p(v, o){
      if (o.scaling === 'logarithmic') {
        v = Math.log(Math.max(v, Number.MIN_VALUE));
        if (o.base !== Math.E) 
          v /= Math.log(o.base);
      }
      return v;
    }

    /**
     * Translates pixel number to data number
     * @param {Number} v - pixel data
     * @return {Number} translated data number
     */
    function p2d(v, o){
      if (o.scaling === 'logarithmic')
        v = (o.base === Math.E) ? Math.exp(v) : Math.pow(o.base, v);
      return v;
    }

    var x = this.axes.x, 
        x2 = this.axes.x2, 
        y = this.axes.y, 
        y2 = this.axes.y2,
        pw = this.plotWidth, 
        ph = this.plotHeight;

    x.scale  = pw / (d2p(x.max, x.options) - d2p(x.min, x.options));
    x2.scale = pw / (d2p(x2.max, x2.options) - d2p(x2.min, x2.options));
    y.scale  = ph / (d2p(y.max, y.options) - d2p(y.min, y.options));
    y2.scale = ph / (d2p(y2.max, y2.options) - d2p(y2.min, y2.options));

    if (this.options.scaling === 'logarithmic') {
        x.d2p = x2.d2p = function(xval){
          var o = this.options;
          return (d2p(xval, o) - d2p(this.min, o)) * this.scale;
        };

        x.p2d = this.axes.x2.p2d = function(xval){
          var o = this.options;
          return p2d(xval / this.scale + d2p(this.min, o), o);
        };

        y.d2p = y2.d2p = function(yval){
          var o = this.options;
          return ph - (d2p(yval, o) - d2p(this.min, o)) * this.scale;
        };

        y.p2d = y2.p2d = function(yval){
          var o = this.options;
          return p2d((ph - yval) / this.scale + d2p(this.min, o), o);
        };
    } else {
        x.d2p = x2.d2p = function(xval){
          return (xval - this.min) * this.scale;
        };

        x.p2d = this.axes.x2.p2d = function(xval){
          return xval / this.scale + this.min;
        };

        y.d2p = y2.d2p = function(yval){
          return ph - (yval - this.min) * this.scale;
        };

        y.p2d = y2.p2d = function(yval){
          return (ph - yval) / this.scale + this.min;
        };
    }
  },
  /**
   * Initializes the canvas and it's overlay canvas element. When the browser is IE, this makes use 
   * of excanvas. The overlay canvas is inserted for displaying interactions. After the canvas elements
   * are created, the elements are inserted into the container element.
   */
  constructCanvas: function(){
    var el = this.el,
      o = this.options,
      size, style;
    
    D.empty(el);
    D.setStyles(el, {position: 'relative', cursor: el.style.cursor || 'default'}); // For positioning labels and overlay.
    size = D.size(el);

    if(size.width <= 0 || size.height <= 0 || o.resolution <= 0){
      throw 'Invalid dimensions for plot, width = ' + size.width + ', height = ' + size.height + ', resolution = ' + o.resolution;
    }
    
    // The old canvases are retrieved to avoid memory leaks ...
    // @TODO Confirm.
    // this.canvas = el.select('.flotr-canvas')[0];
    // this.overlay = el.select('.flotr-overlay')[0];
    this.canvas = getCanvas(this.canvas, 'canvas'); // Main canvas for drawing graph types
    this.overlay = getCanvas(this.overlay, 'overlay'); // Overlay canvas for interactive features
    this.ctx = getContext(this.canvas);
    this.octx = getContext(this.overlay);
    this.canvasHeight = size.height*o.resolution;
    this.canvasWidth = size.width*o.resolution;
    this.textEnabled = !!this.ctx.drawText; // Enable text functions

    function getCanvas(canvas, name){
      if(!canvas){
        canvas = D.create('canvas');
        canvas.className = 'flotr-'+name;
        canvas.style.cssText = 'position:absolute;left:0px;top:0px;';
      }
      _.each(size, function(size, attribute){
        canvas.setAttribute(attribute, size*o.resolution);
        canvas.style[attribute] = size+'px';
        D.show(canvas);
      });
      canvas.context_ = null; // Reset the ExCanvas context
      D.insert(el, canvas);
      return canvas;
    }

    function getContext(canvas){
      if(window.G_vmlCanvasManager) window.G_vmlCanvasManager.initElement(canvas); // For ExCanvas
      var context = canvas.getContext('2d');
      if(!window.G_vmlCanvasManager) context.scale(o.resolution, o.resolution);
      return context;
    }
  },
  processColor: function(color, options){
    var o = { x1: 0, y1: 0, x2: this.plotWidth, y2: this.plotHeight, opacity: 1, ctx: this.ctx };
    _.extend(o, options);
    return Flotr.Color.processColor(color, o);
  },
  registerPlugins: function(){
    var name, plugin, c;
    for (name in Flotr.plugins) {
      plugin = Flotr.plugins[name];
      for (c in plugin.callbacks) {
        // Ensure no old handlers are still observing this element (prevent memory leaks)
        Flotr.EventAdapter.
          stopObserving(this.el, c).
          observe(this.el, c, _.bind(plugin.callbacks[c], this));
      }
      this[name] = _.clone(plugin);
      for (p in this[name]) {
        if (_.isFunction(this[name][p]))
          this[name][p] = _.bind(this[name][p], this);
      }
    }
  },
  /**
   * Calculates a text box dimensions, wether it is drawn on the canvas or inserted into the DOM
   * @param {String} text - The text in the box
   * @param {Object} canvasStyle - An object containing the style for the text if drawn on the canvas
   * @param {String} HtmlStyle - A CSS style for the text if inserted into the DOM
   * @param {Object} className - A CSS className for the text if inserted into the DOM
   */
  getTextDimensions: function(text, canvasStyle, HtmlStyle, className) {
    if (!text) return {width:0, height:0};
    
    if (!this.options.HtmlText && this.textEnabled) {
      var bounds = this.ctx.getTextBounds(text, canvasStyle);
      return {
        width: bounds.width+2, 
        height: bounds.height+6
      };
    }
    else {
      var dummyDiv = D.create('div');
      D.setStyles(dummyDiv, {'position':'absolute', 'top':'-10000px'});
      D.insert(dummyDiv, '<div style="'+HtmlStyle+'" class="'+className+' flotr-dummy-div">' + text + '</div>');
      D.insert(this.el, dummyDiv);
      return D.size(dummyDiv);
    }
  },
  /**
   * Initializes event some handlers.
   */
  initEvents: function () {
    //@TODO: maybe stopObserving with only flotr functions
    Flotr.EventAdapter.
      stopObserving(this.overlay).
      observe(this.overlay, 'mousedown', _.bind(this.mouseDownHandler, this)).
      observe(this.overlay, 'mousemove', _.bind(this.mouseMoveHandler, this)).
      observe(this.overlay, 'mouseout', _.bind(this.clearHit, this)).
      observe(this.overlay, 'click', _.bind(this.clickHandler, this));
  },
  /**
   * Function determines the min and max values for the xaxis and yaxis.
   */
  findDataRanges: function(){
    var s = this.series, 
        a = this.axes;
    
    a.x.datamin = a.x2.datamin = a.y.datamin = a.y2.datamin = Number.MAX_VALUE;
    a.x.datamax = a.x2.datamax = a.y.datamax = a.y2.datamax = -Number.MAX_VALUE;
    
    if(s.length > 0){
      var i, j, h, x, y, data, xaxis, yaxis;
    
      // Get datamin, datamax start values 
      for(i = 0; i < s.length; ++i) {
        data = s[i].data;
        xaxis = s[i].xaxis;
        yaxis = s[i].yaxis;
        
        if (data.length > 0 && !s[i].hide) {
          for(h = data.length - 1; h > -1; --h){
            x = data[h][0];
            
            // Logarithm is only defined for values > 0
            if ((x <= 0) && (xaxis.options.scaling === 'logarithmic')) continue;

            if(x < xaxis.datamin) {
              xaxis.datamin = x;
              xaxis.used = true;
            }
            
            if(x > xaxis.datamax) {
              xaxis.datamax = x;
              xaxis.used = true;
            }
                                          
            for(j = 1; j < data[h].length; j++){
              y = data[h][j];
              
              // Logarithm is only defined for values > 0
              if ((y <= 0) && (yaxis.options.scaling === 'logarithmic')) continue;

              if(y < yaxis.datamin) {
                yaxis.datamin = y;
                yaxis.used = true;
              }
              
              if(y > yaxis.datamax) {
                yaxis.datamax = y;
                yaxis.used = true;
              }
            }
          }
        }
      }
    }
    
    this.findAxesValues();
    
    this.calculateRange(a.x, 'x');
    
    if (a.x2.used) {
      this.calculateRange(a.x2, 'x');
    }
    
    this.calculateRange(a.y, 'y');
    
    if (a.y2.used) {
      this.calculateRange(a.y2, 'y');
    }
  },
  extendRange: function(axis, type) {
    var f = (type === 'y') ? 'extendYRange' : 'extendXRange';
    for (var t in Flotr.graphTypes) {
      if(this.options[t] && this.options[t].show){
        if (this[t][f])  this[t][f](axis);
      } else {
        var extend = false;
        for (i =0 ; i<this.series.length; i++){
          var serie = this.series[i];
          if(serie[t] && serie[t].show){
            extend = true;
            break;
            }
          }
        if(extend)
          if (this[t][f]) this[t][f](axis);
      }
    }
  },
  /**
   * Calculates the range of an axis to apply autoscaling.
   * @param {Object} axis - The axis for what the range will be calculated
   */
  calculateRange: function(axis, type){
    var o = axis.options,
        min = o.min != null ? o.min : axis.datamin,
        max = o.max != null ? o.max : axis.datamax,
        margin = o.autoscaleMargin;
        
    if (o.scaling == 'logarithmic') {
      if (min <= 0) min = axis.datamin;

      // Let it widen later on
      if (max <= 0) max = min;
    }

    if(max - min == 0.0){
      var widen = (max == 0.0) ? 1.0 : 0.01;
      min -= widen;
      max += widen;
    }

    if (o.scaling === 'logarithmic') {
      if (min < 0) min = max / o.base;  // Could be the result of widening

      var maxexp = Math.log(max);
      if (o.base != Math.E) maxexp /= Math.log(o.base);
      maxexp = Math.ceil(maxexp);

      var minexp = Math.log(min);
      if (o.base != Math.E) minexp /= Math.log(o.base);
      minexp = Math.ceil(minexp);
      
      axis.tickSize = Flotr.getTickSize(o.noTicks, minexp, maxexp, o.tickDecimals === null ? 0 : o.tickDecimals);
                        
      // Try to determine a suitable amount of miniticks based on the length of a decade
      if (o.minorTickFreq === null) {
        if (maxexp - minexp > 10)
          o.minorTickFreq = 0;
        else if (maxexp - minexp > 5)
          o.minorTickFreq = 2;
        else
          o.minorTickFreq = 5;
      }
    } else {
      axis.tickSize = Flotr.getTickSize(o.noTicks, min, max, o.tickDecimals);
    }

    axis.min = min;
    axis.max = max; //extendRange may use axis.min or axis.max, so it should be set before it is caled
    
    this.extendRange(axis, type);//extendRange probably changed axis.min and axis.max
    
    // Autoscaling. @todo This probably fails with log scale. Find a testcase and fix it
    if(o.min == null && o.autoscale){
      axis.min -= axis.tickSize * margin;
      // Make sure we don't go below zero if all values are positive.
      if(axis.min < 0 && axis.datamin >= 0) axis.min = 0;
      axis.min = axis.tickSize * Math.floor(axis.min / axis.tickSize);
    }
    
    if(o.max == null && o.autoscale){
      axis.max += axis.tickSize * margin;
      if(axis.max > 0 && axis.datamax <= 0 && axis.datamax != axis.datamin) axis.max = 0;        
      axis.max = axis.tickSize * Math.ceil(axis.max / axis.tickSize);
    }

    if (axis.min == axis.max) axis.max = axis.min + 1;
  },
  /** 
   * Find every values of the x axes or when horizontal stacked bar chart is used also y axes
   */
  findAxesValues: function(){
    var i, j, s;
    for(i = this.series.length-1; i > -1 ; --i){
      s = this.series[i];
      if(!this.executeOnType(this.series, 'findAxesValues', [s])){
        this.findXAxesValues(s);
      }
    }
  },
  /** 
   * Find every values of the x axes
   */
  findXAxesValues: function(s){
    var  j;
    s.xaxis.values = s.xaxis.values || {};
    for (j = s.data.length-1; j > -1 ; --j){
      s.xaxis.values[s.data[j][0]+''] = {};
    }
  },
  /** 
   * Find every values of the y axes
   */
  findYAxesValues: function(s){
    var j;
      s.yaxis.values = s.yaxis.values || {};
      for (j = s.data.length-1; j > -1 ; --j){
        s.yaxis.values[s.data[j][1]+''] = {};
      }
  },
  /**
   * Calculate axis ticks.
   * @param {Object} axis - The axis for what the ticks will be calculated
   */
  calculateTicks: function(axis){
    var o = axis.options, i, v;
    
    axis.ticks = [];  
    axis.minorTicks = [];
    
    if(o.ticks){
      var ticks = o.ticks, 
          minorTicks = o.minorTicks || [], 
          t, label;

      if(_.isFunction(ticks)){
        ticks = ticks({min: axis.min, max: axis.max});
      }
      
      if(_.isFunction(minorTicks)){
        minorTicks = minorTicks({min: axis.min, max: axis.max});
      }
      
      // Clean up the user-supplied ticks, copy them over.
      for(i = 0; i < ticks.length; ++i){
        t = ticks[i];
        if(typeof(t) === 'object'){
          v = t[0];
          label = (t.length > 1) ? t[1] : o.tickFormatter(v);
        }else{
          v = t;
          label = o.tickFormatter(v);
        }
        axis.ticks[i] = { v: v, label: label };
      }
      
      for(i = 0; i < minorTicks.length; ++i){
        t = minorTicks[i];
        if(typeof(t) === 'object'){
          v = t[0];
          label = (t.length > 1) ? t[1] : o.tickFormatter(v);
        }
        else {
          v = t;
          label = o.tickFormatter(v);
        }
        axis.minorTicks[i] = { v: v, label: label };
      }
    }
    else {
      if (o.mode == 'time') {
        var tu = Flotr.Date.timeUnits,
            spec = Flotr.Date.spec,
            delta = (axis.max - axis.min) / axis.options.noTicks,
            size, unit;

        for (i = 0; i < spec.length - 1; ++i) {
          var d = spec[i][0] * tu[spec[i][1]];
          if (delta < (d + spec[i+1][0] * tu[spec[i+1][1]]) / 2 && d >= axis.tickSize)
            break;
        }
        size = spec[i][0];
        unit = spec[i][1];
        
        // special-case the possibility of several years
        if (unit == "year") {
          size = Flotr.getTickSize(axis.options.noTicks*tu.year, axis.min, axis.max, 0);
        }
        
        axis.tickSize = size;
        axis.tickUnit = unit;
        axis.ticks = Flotr.Date.generator(axis);
      }
      else if (o.scaling === 'logarithmic') {
        var max = Math.log(axis.max);
        if (o.base != Math.E) max /= Math.log(o.base);
        max = Math.ceil(max);

        var min = Math.log(axis.min);
        if (o.base != Math.E) min /= Math.log(o.base);
        min = Math.ceil(min);
        
        for (i = min; i < max; i += axis.tickSize) {
          var decadeStart = (o.base == Math.E) ? Math.exp(i) : Math.pow(o.base, i);
          // Next decade begins here:
          var decadeEnd = decadeStart * ((o.base == Math.E) ? Math.exp(axis.tickSize) : Math.pow(o.base, axis.tickSize));
          var stepSize = (decadeEnd - decadeStart) / o.minorTickFreq;
          
          axis.ticks.push({v: decadeStart, label: o.tickFormatter(decadeStart)});
          for (v = decadeStart + stepSize; v < decadeEnd; v += stepSize)
            axis.minorTicks.push({v: v, label: o.tickFormatter(v)});
        }
        
        // Always show the value at the would-be start of next decade (end of this decade)
        var decadeStart = (o.base == Math.E) ? Math.exp(i) : Math.pow(o.base, i);
        axis.ticks.push({v: decadeStart, label: o.tickFormatter(decadeStart)});
      }
      else {
        // Round to nearest multiple of tick size.
        var start = axis.tickSize * Math.ceil(axis.min / axis.tickSize),
            decimals, minorTickSize, v2;
        
        if (o.minorTickFreq)
          minorTickSize = axis.tickSize / o.minorTickFreq;
                          
        // Then store all possible ticks.
        for(i = 0; start + i * axis.tickSize <= axis.max; ++i){
          v = v2 = start + i * axis.tickSize;
          
          // Round (this is always needed to fix numerical instability).
          decimals = o.tickDecimals;
          if(decimals == null) decimals = 1 - Math.floor(Math.log(axis.tickSize) / Math.LN10);
          if(decimals < 0) decimals = 0;
          
          v = v.toFixed(decimals);
          axis.ticks.push({ v: v, label: o.tickFormatter(v) });

          if (o.minorTickFreq) {
            for(var j = 0; j < o.minorTickFreq && (i * axis.tickSize + j * minorTickSize) < axis.max; ++j) {
              v = v2 + j * minorTickSize;
              v = v.toFixed(decimals);
              axis.minorTicks.push({ v: v, label: o.tickFormatter(v) });
            }
          }
        }
      }
    }
  },
  /**
   * Calculates axis label sizes.
   */
  calculateSpacing: function(){
    var a = this.axes,
        options = this.options,
        series = this.series,
        margin = options.grid.labelMargin,
        x = a.x,
        x2 = a.x2,
        y = a.y,
        y2 = a.y2,
        maxOutset = 2,
        i, j, l, dim;
    
    // Labels width and height
    _.each([x, x2, y, y2], function(axis) {
      var maxLabel = '';
      
      if (axis.options.showLabels) {
        for(i = 0; i < axis.ticks.length; ++i){
          l = axis.ticks[i].label.length;
          if(l > maxLabel.length){
            maxLabel = axis.ticks[i].label;
          }
        }
      }
      axis.maxLabel  = this.getTextDimensions(maxLabel, {size:options.fontSize, angle: Flotr.toRad(axis.options.labelsAngle)}, 'font-size:smaller;', 'flotr-grid-label');
      axis.titleSize = this.getTextDimensions(axis.options.title, {size: options.fontSize*1.2, angle: Flotr.toRad(axis.options.titleAngle)}, 'font-weight:bold;', 'flotr-axis-title');
    }, this);

    // Title height
    dim = this.getTextDimensions(options.title, {size: options.fontSize*1.5}, 'font-size:1em;font-weight:bold;', 'flotr-title');
    this.titleHeight = dim.height;

    // Subtitle height
    dim = this.getTextDimensions(options.subtitle, {size: options.fontSize}, 'font-size:smaller;', 'flotr-subtitle');
    this.subtitleHeight = dim.height;

    // Grid outline line width.
    if(options.show){
      maxOutset = Math.max(maxOutset, options.points.radius + options.points.lineWidth/2);
    }
    for(j = 0; j < options.length; ++j){
      if (series[j].points.show){
        maxOutset = Math.max(maxOutset, series[j].points.radius + series[j].points.lineWidth/2);
      }
    }
    
    var p = this.plotOffset;
    if (x.options.margin === false) {
      p.bottom = 0;
      p.top    = 0;
    } else {
      p.bottom += (options.grid.circular ? 0 : (x.options.showLabels ?  (x.maxLabel.height + margin) : 0)) + 
                  (x.options.title ? (x.titleSize.height + margin) : 0) + maxOutset;
    
      p.top    += (options.grid.circular ? 0 : (x2.options.showLabels ? (x2.maxLabel.height + margin) : 0)) + 
                  (x2.options.title ? (x2.titleSize.height + margin) : 0) + this.subtitleHeight + this.titleHeight + maxOutset;
    }
    
    if (y.options.margin === false) {
      p.left  = 0;
      p.right = 0;
    } else {
      p.left   += (options.grid.circular ? 0 : (y.options.showLabels ?  (y.maxLabel.width + margin) : 0)) + 
                  (y.options.title ? (y.titleSize.width + margin) : 0) + maxOutset;
    
      p.right  += (options.grid.circular ? 0 : (y2.options.showLabels ? (y2.maxLabel.width + margin) : 0)) + 
                  (y2.options.title ? (y2.titleSize.width + margin) : 0) + maxOutset;
    }
    
    p.top = Math.floor(p.top); // In order the outline not to be blured
    
    this.plotWidth  = this.canvasWidth - p.left - p.right;
    this.plotHeight = this.canvasHeight - p.bottom - p.top;
  },
  /**
   * Draws grid, labels, series and outline.
   */
  draw: function(after) {
    var afterImageLoad = _.bind(function() {
      this.drawGrid();
      this.drawLabels();
      this.drawTitles();

      if(this.series.length){
        Flotr.EventAdapter.fire(this.el, 'flotr:beforedraw', [this.series, this]);
        
        for(var i = 0; i < this.series.length; i++){
          if (!this.series[i].hide)
            this.drawSeries(this.series[i]);
        }
      }
    
      this.drawOutline();
      Flotr.EventAdapter.fire(this.el, 'flotr:afterdraw', [this.series, this]);
      after();
    }, this);
    
    var g = this.options.grid;
    
    if (g && g.backgroundImage) {
      if (_.isString(g.backgroundImage)){
        g.backgroundImage = {src: g.backgroundImage, left: 0, top: 0};
      }else{
        g.backgroundImage = _.extend({left: 0, top: 0}, g.backgroundImage);
      }
      
      var img = new Image();
      img.onload = _.bind(function() {
        var left = this.plotOffset.left + (parseInt(g.backgroundImage.left) || 0);
        var top = this.plotOffset.top + (parseInt(g.backgroundImage.top) || 0);
        
        // Store the global alpha to restore it later on.
        var globalAlpha = this.ctx.globalAlpha;
        
        // When the watermarkAlpha is < 1 then the watermark is transparent. 
        this.ctx.globalAlpha = (g.backgroundImage.alpha||globalAlpha);
        
        // Draw the watermark.
        this.ctx.drawImage(img, left, top);
        
        // Set the globalAlpha back to the alpha value before changing it to
        // the grid.watermarkAlpha, otherwise the graph will be transparent also.
        this.ctx.globalAlpha = globalAlpha;
        
        afterImageLoad();
        
      }, this);
      
      img.onabort = img.onerror = afterImageLoad;
      img.src = g.backgroundImage.src;
    } else {
      afterImageLoad();
    }
  },
  /**
   * Draws a grid for the graph.
   */
  drawGrid: function(){
    var v, o = this.options,
        ctx = this.ctx, a;
        
    if(o.grid.verticalLines || o.grid.minorVerticalLines || 
           o.grid.horizontalLines || o.grid.minorHorizontalLines){
      Flotr.EventAdapter.fire(this.el, 'flotr:beforegrid', [this.axes.x, this.axes.y, o, this]);
    }
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = o.grid.tickColor;
    
    if (o.grid.circular) {
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = Math.min(this.plotHeight, this.plotWidth)*o.radar.radiusRatio/2,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      // Draw grid lines in vertical direction.
      ctx.beginPath();
      
      if(o.grid.horizontalLines){
        a = this.axes.y;
        for(var i = 0; i < a.ticks.length; ++i){
          v = a.ticks[i].v;
          var ratio = v / a.max;
          
          for(var j = 0; j <= sides; ++j){
            ctx[j == 0 ? 'moveTo' : 'lineTo'](Math.cos(j*coeff+angle)*radius*ratio, Math.sin(j*coeff+angle)*radius*ratio);
          }
          //ctx.moveTo(radius*ratio, 0);
          //ctx.arc(0, 0, radius*ratio, 0, Math.PI*2, true);
        }
      }
      if(o.grid.minorHorizontalLines){
        a = this.axes.y;
        for(var i = 0; i < a.minorTicks.length; ++i){
          v = a.minorTicks[i].v;
          var ratio = v / a.max;
      
          for(var j = 0; j <= sides; ++j){
            ctx[j == 0 ? 'moveTo' : 'lineTo'](Math.cos(j*coeff+angle)*radius*ratio, Math.sin(j*coeff+angle)*radius*ratio);
          }
          //ctx.moveTo(radius*ratio, 0);
          //ctx.arc(0, 0, radius*ratio, 0, Math.PI*2, true);
        }
      }
      
      if(o.grid.verticalLines){
        for(var i = 0; i < sides; ++i){
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(i*coeff+angle)*radius, Math.sin(i*coeff+angle)*radius);
        }
      }
      ctx.stroke();
    }
    else {
      ctx.translate(this.plotOffset.left, this.plotOffset.top);
  
      // Draw grid background, if present in options.
      if(o.grid.backgroundColor != null){
        ctx.fillStyle = this.processColor(o.grid.backgroundColor, {x1: 0, y1: 0, x2: this.plotWidth, y2: this.plotHeight});
        ctx.fillRect(0, 0, this.plotWidth, this.plotHeight);
      }
      
      // Draw grid lines in vertical direction.
      ctx.beginPath();
      
      if(o.grid.verticalLines){
        a = this.axes.x;
        for(var i = 0; i < a.ticks.length; ++i){
          v = a.ticks[i].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
    
          ctx.moveTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, 0);
          ctx.lineTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, this.plotHeight);
        }
      }
      if(o.grid.minorVerticalLines){
        a = this.axes.x;
        for(var i = 0; i < a.minorTicks.length; ++i){
          v = a.minorTicks[i].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
      
          ctx.moveTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, 0);
          ctx.lineTo(Math.floor(a.d2p(v)) + ctx.lineWidth/2, this.plotHeight);
        }
      }
      
      // Draw grid lines in horizontal direction.
      if(o.grid.horizontalLines){
        a = this.axes.y;
        for(var j = 0; j < a.ticks.length; ++j){
          v = a.ticks[j].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
    
          ctx.moveTo(0, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
          ctx.lineTo(this.plotWidth, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
        }
      }
      if(o.grid.minorHorizontalLines){
        a = this.axes.y;
        for(var j = 0; j < a.minorTicks.length; ++j){
          v = a.minorTicks[j].v;
          // Don't show lines on upper and lower bounds.
          if ((v <= a.min || v >= a.max) || 
              (v == a.min || v == a.max) && o.grid.outlineWidth != 0)
            continue;
    
          ctx.moveTo(0, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
          ctx.lineTo(this.plotWidth, Math.floor(a.d2p(v)) + ctx.lineWidth/2);
        }
      }
      ctx.stroke();
    }
    
    ctx.restore();
    if(o.grid.verticalLines || o.grid.minorVerticalLines ||
       o.grid.horizontalLines || o.grid.minorHorizontalLines){
      Flotr.EventAdapter.fire(this.el, 'flotr:aftergrid', [this.axes.x, this.axes.y, o, this]);
    }
  }, 
  /**
   * Draws a outline for the graph.
   */
  drawOutline: function(){
    var v, o = this.options,
        ctx = this.ctx;
    
    if (o.grid.outlineWidth == 0) return;
    
    ctx.save();
    
    if (o.grid.circular) {
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = Math.min(this.plotHeight, this.plotWidth)*o.radar.radiusRatio/2,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      // Draw axis/grid border.
      ctx.beginPath();
      ctx.lineWidth = o.grid.outlineWidth;
      ctx.strokeStyle = o.grid.color;
      ctx.lineJoin = 'round';
      
      for(var i = 0; i <= sides; ++i){
        ctx[i == 0 ? 'moveTo' : 'lineTo'](Math.cos(i*coeff+angle)*radius, Math.sin(i*coeff+angle)*radius);
      }
      //ctx.arc(0, 0, radius, 0, Math.PI*2, true);

      ctx.stroke();
    }
    else {
      ctx.translate(this.plotOffset.left, this.plotOffset.top);
      
      // Draw axis/grid border.
      var lw = o.grid.outlineWidth,
          orig = 0.5-lw+((lw+1)%2/2);
      ctx.lineWidth = lw;
      ctx.strokeStyle = o.grid.color;
      ctx.lineJoin = 'miter';
      ctx.strokeRect(orig, orig, this.plotWidth, this.plotHeight);
    }
    
    ctx.restore();
  },
  /**
   * Draws labels for x and y axis.
   */   
  drawLabels: function(){    
    // Construct fixed width label boxes, which can be styled easily. 
    var noLabels = 0, axis,
        xBoxWidth, i, html, tick, left, top,
        options = this.options,
        ctx = this.ctx,
        a = this.axes;
    
    for(i = 0; i < a.x.ticks.length; ++i){
      if (a.x.ticks[i].label) {
        ++noLabels;
      }
    }
    xBoxWidth = this.plotWidth / noLabels;
    
    if (options.grid.circular) {
      ctx.save();
      ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
      var radius = this.plotHeight*options.radar.radiusRatio/2 + options.fontSize,
          sides = this.axes.x.ticks.length,
          coeff = 2*(Math.PI/sides),
          angle = -Math.PI/2;
      
      var style = {
        size: options.fontSize
      };

      // Add x labels.
      axis = a.x;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels; ++i){
        tick = axis.ticks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
        
        var x = Math.cos(i*coeff+angle) * radius, 
            y = Math.sin(i*coeff+angle) * radius;
            
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = (Math.abs(x) < 0.1 ? 'center' : (x < 0 ? 'right' : 'left'));

        Flotr.drawText(ctx, tick.label, x, y, style);
      }
      for(i = 0; i < axis.minorTicks.length && axis.options.showMinorLabels; ++i){
        tick = axis.minorTicks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
      
        var x = Math.cos(i*coeff+angle) * radius, 
            y = Math.sin(i*coeff+angle) * radius;
            
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = (Math.abs(x) < 0.1 ? 'center' : (x < 0 ? 'right' : 'left'));

        Flotr.drawText(ctx, tick.label, x, y, style);
      }
      
      // Add y labels.
      axis = a.y;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels; ++i){
        tick = axis.ticks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = 'left';
        
        Flotr.drawText(ctx, tick.label, 3, -(axis.ticks[i].v / axis.max) * (radius - options.fontSize), style);
      }
      for(i = 0; i < axis.minorTicks.length && axis.options.showMinorLabels; ++i){
        tick = axis.minorTicks[i];
        tick.label += '';
        if(!tick.label || tick.label.length == 0) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textBaseline = 'middle';
        style.textAlign = 'left';
        
        Flotr.drawText(ctx, tick.label, 3, -(axis.ticks[i].v / axis.max) * (radius - options.fontSize), style);
      }
      ctx.restore();
      return;
    }
    
    if (!options.HtmlText && this.textEnabled) {
      var style = {
        size: options.fontSize
      };
  
      // Add x labels.
      axis = a.x;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if(!tick.label || tick.label.length == 0) continue;
        
        left = axis.d2p(tick.v);
        if (left < 0 || left > this.plotWidth) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'center';
        style.textBaseline = 'top';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left + left, 
          this.plotOffset.top + this.plotHeight + options.grid.labelMargin,
          style
        );
      }
        
      // Add x2 labels.
      axis = a.x2;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if(!tick.label || tick.label.length == 0) continue;
        
        left = axis.d2p(tick.v);
        if(left < 0 || left > this.plotWidth) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'center';
        style.textBaseline = 'bottom';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left + left, 
          this.plotOffset.top + options.grid.labelMargin,
          style
        );
      }
        
      // Add y labels.
      axis = a.y;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if (!tick.label || tick.label.length == 0) continue;
        
        top = axis.d2p(tick.v);
        if(top < 0 || top > this.plotHeight) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'right';
        style.textBaseline = 'middle';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left - options.grid.labelMargin, 
          this.plotOffset.top + top,
          style
        );
      }
        
      // Add y2 labels.
      axis = a.y2;
      style.color = axis.options.color || options.grid.color;
      for(i = 0; i < axis.ticks.length && axis.options.showLabels && axis.used; ++i){
        tick = axis.ticks[i];
        if (!tick.label || tick.label.length == 0) continue;
        
        top = axis.d2p(tick.v);
        if(top < 0 || top > this.plotHeight) continue;
        
        style.angle = Flotr.toRad(axis.options.labelsAngle);
        style.textAlign = 'left';
        style.textBaseline = 'middle';
        style = Flotr.getBestTextAlign(style.angle, style);
        
        Flotr.drawText(
          ctx, tick.label,
          this.plotOffset.left + this.plotWidth + options.grid.labelMargin, 
          this.plotOffset.top + top,
          style
        );
        
        ctx.save();
        ctx.strokeStyle = style.color;
        ctx.beginPath();
        ctx.moveTo(this.plotOffset.left + this.plotWidth - 8, this.plotOffset.top + axis.d2p(tick.v));
        ctx.lineTo(this.plotOffset.left + this.plotWidth,     this.plotOffset.top + axis.d2p(tick.v));
        ctx.stroke();
        ctx.restore();
      }
    } 
    else if (a.x.options.showLabels || a.x2.options.showLabels || a.y.options.showLabels || a.y2.options.showLabels) {
      html = [];
      
      // Add x labels.
      axis = a.x;
      if (axis.options.showLabels){
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if(!tick.label || tick.label.length == 0 || 
              (this.plotOffset.left + axis.d2p(tick.v) < 0) || 
              (this.plotOffset.left + axis.d2p(tick.v) > this.canvasWidth)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top + this.plotHeight + options.grid.labelMargin), 'px;left:', 
            (this.plotOffset.left +axis.d2p(tick.v) - xBoxWidth/2), 'px;width:', 
            xBoxWidth, 'px;text-align:center;', (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label">', tick.label, '</div>'
          );
        }
      }
      
      // Add x2 labels.
      axis = a.x2;
      if (axis.options.showLabels && axis.used){
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if(!tick.label || tick.label.length == 0 || 
              (this.plotOffset.left + axis.d2p(tick.v) < 0) || 
              (this.plotOffset.left + axis.d2p(tick.v) > this.canvasWidth)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top - options.grid.labelMargin - axis.maxLabel.height), 'px;left:', 
            (this.plotOffset.left + axis.d2p(tick.v) - xBoxWidth/2), 'px;width:', 
            xBoxWidth, 'px;text-align:center;', (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label">', tick.label, '</div>'
          );
        }
      }
      
      // Add y labels.
      axis = a.y;
      if (axis.options.showLabels){
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if (!tick.label || tick.label.length == 0 ||
               (this.plotOffset.top + axis.d2p(tick.v) < 0) || 
               (this.plotOffset.top + axis.d2p(tick.v) > this.canvasHeight)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top + axis.d2p(tick.v) - axis.maxLabel.height/2), 'px;left:0;width:', 
            (this.plotOffset.left - options.grid.labelMargin), 'px;text-align:right;', 
            (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label flotr-grid-label-y">', tick.label, '</div>'
          );
        }
      }
      
      // Add y2 labels.
      axis = a.y2;
      if (axis.options.showLabels && axis.used){
        ctx.save();
        ctx.strokeStyle = axis.options.color || options.grid.color;
        ctx.beginPath();
        
        for(i = 0; i < axis.ticks.length; ++i){
          tick = axis.ticks[i];
          if (!tick.label || tick.label.length == 0 ||
               (this.plotOffset.top + axis.d2p(tick.v) < 0) || 
               (this.plotOffset.top + axis.d2p(tick.v) > this.canvasHeight)) continue;
          
          html.push(
            '<div style="position:absolute;top:', 
            (this.plotOffset.top + axis.d2p(tick.v) - axis.maxLabel.height/2), 'px;right:0;width:', 
            (this.plotOffset.right - options.grid.labelMargin), 'px;text-align:left;', 
            (axis.options.color?('color:'+axis.options.color+';'):''), 
            '" class="flotr-grid-label flotr-grid-label-y">', tick.label, '</div>'
          );

          ctx.moveTo(this.plotOffset.left + this.plotWidth - 8, this.plotOffset.top + axis.d2p(tick.v));
          ctx.lineTo(this.plotOffset.left + this.plotWidth,     this.plotOffset.top + axis.d2p(tick.v));
        }
        ctx.stroke();
        ctx.restore();
      }
      
      html = html.join('');

      var div = D.create('div');
      D.setStyles(div, {
        fontSize: 'smaller',
        color: options.grid.color 
      });
      div.className = 'flotr-labels';
      D.insert(this.el, div);
      D.insert(div, html);
    }
  },
  /**
   * Draws the title and the subtitle
   */
  drawTitles: function(){
    var html,
        options = this.options,
        margin = options.grid.labelMargin,
        ctx = this.ctx,
        a = this.axes;
    
    if (!options.HtmlText && this.textEnabled) {
      var style = {
        size: options.fontSize,
        color: options.grid.color,
        textAlign: 'center'
      };
      
      // Add subtitle
      if (options.subtitle){
        Flotr.drawText(
          ctx, options.subtitle,
          this.plotOffset.left + this.plotWidth/2, 
          this.titleHeight + this.subtitleHeight - 2,
          style
        );
      }
      
      style.weight = 1.5;
      style.size *= 1.5;
      
      // Add title
      if (options.title){
        Flotr.drawText(
          ctx, options.title,
          this.plotOffset.left + this.plotWidth/2, 
          this.titleHeight - 2,
          style
        );
      }
      
      style.weight = 1.8;
      style.size *= 0.8;
      
      // Add x axis title
      if (a.x.options.title && a.x.used){
        style.textAlign = a.x.options.titleAlign || 'center';
        style.textBaseline = 'top';
        style.angle = Flotr.toRad(a.x.options.titleAngle);
        style = Flotr.getBestTextAlign(style.angle, style);
        Flotr.drawText(
          ctx, a.x.options.title,
          this.plotOffset.left + this.plotWidth/2, 
          this.plotOffset.top + a.x.maxLabel.height + this.plotHeight + 2 * margin,
          style
        );
      }
      
      // Add x2 axis title
      if (a.x2.options.title && a.x2.used){
        style.textAlign = a.x2.options.titleAlign || 'center';
        style.textBaseline = 'bottom';
        style.angle = Flotr.toRad(a.x2.options.titleAngle);
        style = Flotr.getBestTextAlign(style.angle, style);
        Flotr.drawText(
          ctx, a.x2.options.title,
          this.plotOffset.left + this.plotWidth/2, 
          this.plotOffset.top - a.x2.maxLabel.height - 2 * margin,
          style
        );
      }
      
      // Add y axis title
      if (a.y.options.title && a.y.used){
        style.textAlign = a.y.options.titleAlign || 'right';
        style.textBaseline = 'middle';
        style.angle = Flotr.toRad(a.y.options.titleAngle);
        style = Flotr.getBestTextAlign(style.angle, style);
        Flotr.drawText(
          ctx, a.y.options.title,
          this.plotOffset.left - a.y.maxLabel.width - 2 * margin, 
          this.plotOffset.top + this.plotHeight / 2,
          style
        );
      }
      
      // Add y2 axis title
      if (a.y2.options.title && a.y2.used){
        style.textAlign = a.y2.options.titleAlign || 'left';
        style.textBaseline = 'middle';
        style.angle = Flotr.toRad(a.y2.options.titleAngle);
        style = Flotr.getBestTextAlign(style.angle, style);
        Flotr.drawText(
          ctx, a.y2.options.title,
          this.plotOffset.left + this.plotWidth + a.y2.maxLabel.width + 2 * margin, 
          this.plotOffset.top + this.plotHeight / 2,
          style
        );
      }
    } 
    else {
      html = [];
      
      // Add title
      if (options.title)
        html.push(
          '<div style="position:absolute;top:0;left:', 
          this.plotOffset.left, 'px;font-size:1em;font-weight:bold;text-align:center;width:',
          this.plotWidth,'px;" class="flotr-title">', options.title, '</div>'
        );
      
      // Add subtitle
      if (options.subtitle)
        html.push(
          '<div style="position:absolute;top:', this.titleHeight, 'px;left:', 
          this.plotOffset.left, 'px;font-size:smaller;text-align:center;width:',
          this.plotWidth, 'px;" class="flotr-subtitle">', options.subtitle, '</div>'
        );

      html.push('</div>');
      
      html.push('<div class="flotr-axis-title" style="font-weight:bold;">');
      
      // Add x axis title
      if (a.x.options.title && a.x.used)
        html.push(
          '<div style="position:absolute;top:', 
          (this.plotOffset.top + this.plotHeight + options.grid.labelMargin + a.x.titleSize.height), 
          'px;left:', this.plotOffset.left, 'px;width:', this.plotWidth, 
          'px;text-align:center;" class="flotr-axis-title">', a.x.options.title, '</div>'
        );
      
      // Add x2 axis title
      if (a.x2.options.title && a.x2.used)
        html.push(
          '<div style="position:absolute;top:0;left:', this.plotOffset.left, 'px;width:', 
          this.plotWidth, 'px;text-align:center;" class="flotr-axis-title">', a.x2.options.title, '</div>'
        );
      
      // Add y axis title
      if (a.y.options.title && a.y.used)
        html.push(
          '<div style="position:absolute;top:', 
          (this.plotOffset.top + this.plotHeight/2 - a.y.titleSize.height/2), 
          'px;left:0;text-align:right;" class="flotr-axis-title">', a.y.options.title, '</div>'
        );
      
      // Add y2 axis title
      if (a.y2.options.title && a.y2.used)
        html.push(
          '<div style="position:absolute;top:', 
          (this.plotOffset.top + this.plotHeight/2 - a.y.titleSize.height/2), 
          'px;right:0;text-align:right;" class="flotr-axis-title">', a.y2.options.title, '</div>'
        );
      
      html = html.join('');

      var div = D.create('div');
      D.setStyles({
        color: options.grid.color 
      });
      div.className = 'flotr-titles';
      D.insert(this.el, div);
      D.insert(div, html);
    }
  },
  /**
   * Actually draws the graph.
   * @param {Object} series - series to draw
   */
  drawSeries: function(series){
    series = series || this.series;
    
    var drawn = false;
    for(type in Flotr.graphTypes){
      if(series[type] && series[type].show){
        drawn = true;
        this[type].draw(series);
      }
    }
    
    if(!drawn){
      this[this.options.defaultType].draw(series);
    }
  },
  /**
   * Calculates the coordinates from a mouse event object.
   * @param {Event} event - Mouse Event object.
   * @return {Object} Object with coordinates of the mouse.
   */
  getEventPosition: function (e){

    var offset = D.position(this.overlay),
        pointer = eventPointer(e),
        rx = (pointer.x - offset.left - this.plotOffset.left),
        ry = (pointer.y - offset.top - this.plotOffset.top);

    return {
      x:  this.axes.x.p2d(rx),
      x2: this.axes.x2.p2d(rx),
      y:  this.axes.y.p2d(ry),
      y2: this.axes.y2.p2d(ry),
      relX: rx,
      relY: ry,
      absX: pointer.x,
      absY: pointer.y
    };
  },
  /**
   * Observes the 'click' event and fires the 'flotr:click' event.
   * @param {Event} event - 'click' Event object.
   */
  clickHandler: function(event){
    if(this.ignoreClick){
      this.ignoreClick = false;
      return this.ignoreClick;
    }
    Flotr.EventAdapter.fire(this.el, 'flotr:click', [this.getEventPosition(event), this]);
  },
  /**
   * Observes mouse movement over the graph area. Fires the 'flotr:mousemove' event.
   * @param {Event} event - 'mousemove' Event object.
   */
  mouseMoveHandler: function(event){
    var pos = this.getEventPosition(event);

    this.lastMousePos.pageX = pos.absX;
    this.lastMousePos.pageY = pos.absY;  
      
      //@todo Add another overlay for the crosshair
    if (this.options.crosshair.mode)
      this.clearCrosshair();
      
    if(this.selectionInterval == null && (this.options.mouse.track || _.any(this.series, function(s){return s.mouse && s.mouse.track;})))
      this.hit(pos);
    
    if (this.options.crosshair.mode)
      this.drawCrosshair(pos);
    
    Flotr.EventAdapter.fire(this.el, 'flotr:mousemove', [event, pos, this]);
  },
  /**
   * Observes the 'mousedown' event.
   * @param {Event} event - 'mousedown' Event object.
   */
  mouseDownHandler: function (event){

    /*
    // @TODO Context menu?
    if(event.isRightClick()) {
      event.stop();

      var overlay = this.overlay;
      overlay.hide();
      
      function cancelContextMenu () {
        overlay.show();
        Flotr.EventAdapter.stopObserving(document, 'mousemove', cancelContextMenu);
      }
      Flotr.EventAdapter.observe(document, 'mousemove', cancelContextMenu);
      return;
    }
    */

    function isLeftClick (e, type) {
      return (e.which ? (e.which === 1) : (e.button === 0 || e.button === 1));
    }

    if(!this.options.selection.mode || !isLeftClick(event)) return;

    var pointer = eventPointer(event);
    this.setSelectionPos(this.selection.first, {pageX:pointer.x, pageY:pointer.y});
    if(this.selectionInterval != null){
      clearInterval(this.selectionInterval);
    }
    this.lastMousePos.pageX = null;
    this.selectionInterval = 
      setInterval(_.bind(this.updateSelection, this), 1000/this.options.selection.fps);
    
    this.mouseUpHandler = _.bind(this.mouseUpHandler, this);
    Flotr.EventAdapter.observe(document, 'mouseup', this.mouseUpHandler);
  },
  /**
   * Fires the 'flotr:select' event when the user made a selection.
   */
  fireSelectEvent: function(){
    var a = this.axes, s = this.selection,
        x1, x2, y1, y2;
    
    x1 = a.x.p2d(s.first.x);
    x2 = a.x.p2d(s.second.x);
    y1 = a.y.p2d(s.first.y);
    y2 = a.y.p2d(s.second.y);

    Flotr.EventAdapter.fire(this.el, 'flotr:select', [{
      x1:Math.min(x1, x2), 
      y1:Math.min(y1, y2), 
      x2:Math.max(x1, x2), 
      y2:Math.max(y1, y2),
      xfirst:x1, xsecond:x2, yfirst:y1, ysecond:y2
    }, this]);
  },
  /**
   * Observes the mouseup event for the document. 
   * @param {Event} event - 'mouseup' Event object.
   */
  mouseUpHandler: function(event){
    Flotr.EventAdapter.stopObserving(document, 'mouseup', this.mouseUpHandler);
    // @TODO why?
    //event.stop();
    
    if(this.selectionInterval != null){
      clearInterval(this.selectionInterval);
      this.selectionInterval = null;
    }

    var pointer = eventPointer(event);
    this.setSelectionPos(this.selection.second, {pageX:pointer.x, pageY:pointer.y});
    this.clearSelection();
    
    if(this.selectionIsSane()){
      this.drawSelection();
      this.fireSelectEvent();
      this.ignoreClick = true;
    }
  },
  /**
   * Calculates the position of the selection.
   * @param {Object} pos - Position object.
   * @param {Event} event - Event object.
   */
  setSelectionPos: function(pos, pointer) {
    var options = this.options,
        offset = D.position(this.overlay);

    if(options.selection.mode.indexOf('x') == -1){
      pos.x = (pos == this.selection.first) ? 0 : this.plotWidth;         
    }else{
      pos.x = pointer.pageX - offset.left - this.plotOffset.left;
      pos.x = Math.min(Math.max(0, pos.x), this.plotWidth);
    }

    if (options.selection.mode.indexOf('y') == -1){
      pos.y = (pos == this.selection.first) ? 0 : this.plotHeight;
    }else{
      pos.y = pointer.pageY - offset.top - this.plotOffset.top;
      pos.y = Math.min(Math.max(0, pos.y), this.plotHeight);
    }
  },
  /**
   * Updates (draws) the selection box.
   */
  updateSelection: function(){
    if(this.lastMousePos.pageX == null) return;
    
    this.setSelectionPos(this.selection.second, this.lastMousePos);
    this.clearSelection();
    
    if(this.selectionIsSane()) this.drawSelection();
  },
  /**
   * Removes the selection box from the overlay canvas.
   */
  clearSelection: function() {
    if(this.prevSelection == null) return;
      
    var prevSelection = this.prevSelection,
      lw = this.octx.lineWidth,
      plotOffset = this.plotOffset,
      x = Math.min(prevSelection.first.x, prevSelection.second.x),
      y = Math.min(prevSelection.first.y, prevSelection.second.y),
      w = Math.abs(prevSelection.second.x - prevSelection.first.x),
      h = Math.abs(prevSelection.second.y - prevSelection.first.y);
    
    this.octx.clearRect(x + plotOffset.left - lw/2+0.5,
                        y + plotOffset.top - lw/2+0.5,
                        w + lw,
                        h + lw);
    
    this.prevSelection = null;
  },
  /**
   * Allows the user the manually select an area.
   * @param {Object} area - Object with coordinates to select.
   */
  setSelection: function(area, preventEvent){
    var options = this.options,
      xa = this.axes.x,
      ya = this.axes.y,
      vertScale = ya.scale,
      hozScale = xa.scale,
      selX = options.selection.mode.indexOf('x') != -1,
      selY = options.selection.mode.indexOf('y') != -1;
    
    this.clearSelection();

    this.selection.first.y  = (selX && !selY) ? 0 : (ya.max - area.y1) * vertScale;
    this.selection.second.y = (selX && !selY) ? this.plotHeight : (ya.max - area.y2) * vertScale;      
    this.selection.first.x  = (selY && !selX) ? 0 : (area.x1 - xa.min) * hozScale;
    this.selection.second.x = (selY && !selX) ? this.plotWidth : (area.x2 - xa.min) * hozScale;
    
    this.drawSelection();
    if (!preventEvent)
      this.fireSelectEvent();
  },
  /**
   * Draws the selection box.
   */
  drawSelection: function() {
    var prevSelection = this.prevSelection,
      s = this.selection,
      octx = this.octx,
      options = this.options,
      plotOffset = this.plotOffset;
    
    if(prevSelection != null &&
      s.first.x == prevSelection.first.x &&
      s.first.y == prevSelection.first.y && 
      s.second.x == prevSelection.second.x &&
      s.second.y == prevSelection.second.y)
      return;

    octx.save();
    octx.strokeStyle = this.processColor(options.selection.color, {opacity: 0.8});
    octx.lineWidth = 1;
    octx.lineJoin = 'miter';
    octx.fillStyle = this.processColor(options.selection.color, {opacity: 0.4});

    this.prevSelection = {
      first: { x: s.first.x, y: s.first.y },
      second: { x: s.second.x, y: s.second.y }
    };

    var x = Math.min(s.first.x, s.second.x),
        y = Math.min(s.first.y, s.second.y),
        w = Math.abs(s.second.x - s.first.x),
        h = Math.abs(s.second.y - s.first.y);
    
    octx.fillRect(x + plotOffset.left+0.5, y + plotOffset.top+0.5, w, h);
    octx.strokeRect(x + plotOffset.left+0.5, y + plotOffset.top+0.5, w, h);
    octx.restore();
  },
  /**   
   * Draws the selection box.
   */
  drawCrosshair: function(pos) {
    var octx = this.octx,
      options = this.options,
      plotOffset = this.plotOffset,
      x = plotOffset.left+pos.relX+0.5,
      y = plotOffset.top+pos.relY+0.5;
    
    if (pos.relX < 0 || pos.relY < 0 || pos.relX > this.plotWidth || pos.relY > this.plotHeight) {
      this.el.style.cursor = null;
      D.removeClass(this.el, 'flotr-crosshair');
      return; 
    }
    
    this.lastMousePos.relX = null;
    this.lastMousePos.relY = null;
    
    if (options.crosshair.hideCursor) {
      this.el.style.cursor = 'none';
      D.addClass(this.el, 'flotr-crosshair');
    }
    
    octx.save();
    octx.strokeStyle = options.crosshair.color;
    octx.lineWidth = 1;
    octx.beginPath();
    
    if (options.crosshair.mode.indexOf('x') != -1) {
      octx.moveTo(x, plotOffset.top);
      octx.lineTo(x, plotOffset.top + this.plotHeight);
      this.lastMousePos.relX = x;
    }
    
    if (options.crosshair.mode.indexOf('y') != -1) {
      octx.moveTo(plotOffset.left, y);
      octx.lineTo(plotOffset.left + this.plotWidth, y);
      this.lastMousePos.relY = y;
    }
    
    octx.stroke();
    octx.restore();
  },
  /**
   * Removes the selection box from the overlay canvas.
   */
  clearCrosshair: function() {
    if (this.lastMousePos.relX != null)
      this.octx.clearRect(this.lastMousePos.relX-0.5, this.plotOffset.top, 1,this.plotHeight+1);
    
    if (this.lastMousePos.relY != null)
      this.octx.clearRect(this.plotOffset.left, this.lastMousePos.relY-0.5, this.plotWidth+1, 1);    
  },
  /**
   * Determines whether or not the selection is sane and should be drawn.
   * @return {Boolean} - True when sane, false otherwise.
   */
  selectionIsSane: function(){
    return Math.abs(this.selection.second.x - this.selection.first.x) >= 5 &&
           Math.abs(this.selection.second.y - this.selection.first.y) >= 5;
  },
  /**
   * Removes the mouse tracking point from the overlay.
   */
  clearHit: function(){
    var prev = this.prevHit;
    if(prev && !this.executeOnType(prev.series, 'clearHit')){
      var plotOffset = this.plotOffset,
        s = prev.series,
        lw = (s.bars ? s.bars.lineWidth : 1),
        offset = s.mouse.radius + lw;
      this.octx.clearRect(
        plotOffset.left + prev.xaxis.d2p(prev.x) - offset,
        plotOffset.top  + prev.yaxis.d2p(prev.y) - offset,
        offset*2,
        offset*2
      );
    }
  },
  /**
   * Updates the mouse tracking point on the overlay.
   */
  drawHit: function(n){
    var octx = this.octx,
      s = n.series;

    if(s.mouse.lineColor != null){
      octx.save();
      octx.lineWidth = (s.points ? s.points.lineWidth : 1);
      octx.strokeStyle = s.mouse.lineColor;
      octx.fillStyle = this.processColor(s.mouse.fillColor || '#ffffff', {opacity: s.mouse.fillOpacity});

      if (!this.executeOnType(s, 'drawHit', [n])) {
        var xa = n.xaxis,
          ya = n.yaxis;

        octx.translate(this.plotOffset.left, this.plotOffset.top);
        octx.beginPath();
          octx.arc(xa.d2p(n.x), ya.d2p(n.y), s.mouse.radius, 0, 2 * Math.PI, true);
          octx.fill();
          octx.stroke();
        octx.closePath();
      }
      octx.restore();
    }
    this.prevHit = n;
  },
  /**
   * Retrieves the nearest data point from the mouse cursor. If it's within
   * a certain range, draw a point on the overlay canvas and display the x and y
   * value of the data.
   * @param {Object} mouse - Object that holds the relative x and y coordinates of the cursor.
   */
  hit: function(mouse){
    var series = this.series,
      options = this.options,
      prevHit = this.prevHit,
      plotOffset = this.plotOffset,
      octx = this.octx, 
      data, sens, xsens, ysens, x, y, xa, ya, mx, my, i,
      /**
       * Nearest data element.
       */
      n = {
        dist:Number.MAX_VALUE,
        x:null,
        y:null,
        relX:mouse.relX,
        relY:mouse.relY,
        absX:mouse.absX,
        absY:mouse.absY,
        sAngle:null,
        eAngle:null,
        fraction: null,
        mouse:null,
        xaxis:null,
        yaxis:null,
        series:null,
        index:null,
        seriesIndex:null
      };

    if (options.mouse.trackAll) {
      for(i = 0; i < series.length; i++){
        s = series[0];
        data = s.data;
        xa = s.xaxis;
        ya = s.yaxis;
        xsens = (2*options.points.lineWidth)/xa.scale * s.mouse.sensibility;
        mx = xa.p2d(mouse.relX);
        my = ya.p2d(mouse.relY);
    
        for(var j = 0; j < data.length; j++){
          x = data[j][0];
          y = data[j][1];
    
          if (y === null ||
              xa.min > x || xa.max < x ||
              ya.min > y || ya.max < y ||
              mx < xa.min || mx > xa.max ||
              my < ya.min || my > ya.max) continue;
    
          var xdiff = Math.abs(x - mx);
    
          // Bars and Pie are not supported yet. Not sure how it should look with bars or Pie
          if((!s.bars.show && xdiff < xsens) 
              || (s.bars.show && xdiff < s.bars.barWidth/2) 
              || (y < 0 && my < 0 && my > y)) {
            
            var distance = xdiff;
            
            if (distance < n.dist) {
              n.dist = distance;
              n.x = x;
              n.y = y;
              n.xaxis = xa;
              n.yaxis = ya;
              n.mouse = s.mouse;
              n.series = s; 
              n.allSeries = series; // include all series
              n.index = j;
            }
          }
        }
      }
    }
    else if(!this.executeOnType(series, 'hit', [mouse, n])) {
      for(i = 0; i < series.length; i++){
        s = series[i];
        if(!s.mouse.track) continue;
        
        data = s.data;
        xa = s.xaxis;
        ya = s.yaxis;
        sens = 2 * (options.points ? options.points.lineWidth : 1) * s.mouse.sensibility;
        xsens = sens/xa.scale;
        ysens = sens/ya.scale;
        mx = xa.p2d(mouse.relX);
        my = ya.p2d(mouse.relY);
        
        //if (s.points) {
        //  var h = this.points.getHit(s, mouse);
        //  if (h.index !== undefined) console.log(h);
        //}
                
        for(var j = 0, xpow, ypow; j < data.length; j++){
          x = data[j][0];
          y = data[j][1];
          
          if (y === null || 
              xa.min > x || xa.max < x || 
              ya.min > y || ya.max < y) continue;
          
          if(s.bars.show && s.bars.centered){
            var xdiff = Math.abs(x - mx),
              ydiff = Math.abs(y - my);
          } else {
            if (s.bars.horizontal){
              var xdiff = Math.abs(x - mx),
                ydiff = Math.abs(y + s.bars.barWidth/2 - my);
            } else {
              var xdiff = Math.abs(x + s.bars.barWidth/2 - mx),
                ydiff = Math.abs(y - my);
            }
          }
          
          // we use a different set of criteria to determin if there has been a hit
          // depending on what type of graph we have
          if(((!s.bars.show) && xdiff < xsens && (!s.mouse.trackY || ydiff < ysens)) ||
              // Bars check
              (s.bars.show && (!s.bars.horizontal && xdiff < s.bars.barWidth/2 + 1/xa.scale // Check x bar boundary, with adjustment for scale (when bars ~1px)
              && (!s.mouse.trackY || (y > 0 && my > 0 && my < y) || (y < 0 && my < 0 && my > y))) 
              || (s.bars.horizontal && ydiff < s.bars.barWidth/2 + 1/ya.scale // Check x bar boundary, with adjustment for scale (when bars ~1px)
              && ((x > 0 && mx > 0 && mx < x) || (x < 0 && mx < 0 && mx > x))))){ // for horizontal bars there is need to use y-axis tracking, so s.mouse.trackY is ignored
            
            var distance = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
            if(distance < n.dist){
              n.dist = distance;
              n.x = x;
              n.y = y;
              n.xaxis = xa;
              n.yaxis = ya;
              n.mouse = s.mouse;
              n.series = s;
              n.allSeries = series;
              n.index = j;
              n.seriesIndex = i;
            }
          }
        }
      }
    }
    
    if(n.series && (n.mouse && n.mouse.track && !prevHit || (prevHit /*&& (n.x != prevHit.x || n.y != prevHit.y)*/))){
      var mt = this.getMouseTrack(),
          pos = '', 
          s = n.series,
          p = n.mouse.position, 
          m = n.mouse.margin,
          elStyle = 'opacity:0.7;background-color:#000;color:#fff;display:none;position:absolute;padding:2px 8px;-moz-border-radius:4px;border-radius:4px;white-space:nowrap;';
      
      if (!n.mouse.relative) { // absolute to the canvas
             if(p.charAt(0) == 'n') pos += 'top:' + (m + plotOffset.top) + 'px;bottom:auto;';
        else if(p.charAt(0) == 's') pos += 'bottom:' + (m + plotOffset.bottom) + 'px;top:auto;';
             if(p.charAt(1) == 'e') pos += 'right:' + (m + plotOffset.right) + 'px;left:auto;';
        else if(p.charAt(1) == 'w') pos += 'left:' + (m + plotOffset.left) + 'px;right:auto;';
      }
      else { // relative to the mouse or in the case of bar like graphs to the bar
        if(!s.bars.show && !s.pie.show){
               if(p.charAt(0) == 'n') pos += 'bottom:' + (m - plotOffset.top - n.yaxis.d2p(n.y) + this.canvasHeight) + 'px;top:auto;';
          else if(p.charAt(0) == 's') pos += 'top:' + (m + plotOffset.top + n.yaxis.d2p(n.y)) + 'px;bottom:auto;';
               if(p.charAt(1) == 'e') pos += 'left:' + (m + plotOffset.left + n.xaxis.d2p(n.x)) + 'px;right:auto;';
          else if(p.charAt(1) == 'w') pos += 'right:' + (m - plotOffset.left - n.xaxis.d2p(n.x) + this.canvasWidth) + 'px;left:auto;';
        }

        else if (s.bars.show) {
          pos += 'bottom:' + (m - plotOffset.top - n.yaxis.d2p(n.y/2) + this.canvasHeight) + 'px;top:auto;';
          pos += 'left:' + (m + plotOffset.left + n.xaxis.d2p(n.x - options.bars.barWidth/2)) + 'px;right:auto;';
        }
        else {
          var center = {
            x: (this.plotWidth)/2,
            y: (this.plotHeight)/2
          },
          radius = (Math.min(this.canvasWidth, this.canvasHeight) * s.pie.sizeRatio) / 2,
          bisection = n.sAngle<n.eAngle ? (n.sAngle + n.eAngle) / 2: (n.sAngle + n.eAngle + 2* Math.PI) / 2;
          
          pos += 'bottom:' + (m - plotOffset.top - center.y - Math.sin(bisection) * radius/2 + this.canvasHeight) + 'px;top:auto;';
          pos += 'left:' + (m + plotOffset.left + center.x + Math.cos(bisection) * radius/2) + 'px;right:auto;';
        }
      }
      elStyle += pos;

      mt.style.cssText = elStyle;

      if(n.x !== null && n.y !== null){
        D.show(mt);
        
        this.clearHit();
        this.drawHit(n);
        
        var decimals = n.mouse.trackDecimals;
        if(decimals == null || decimals < 0) decimals = 0;
        
        mt.innerHTML = n.mouse.trackFormatter({
          x: n.x.toFixed(decimals), 
          y: n.y.toFixed(decimals), 
          series: n.series, 
          index: n.index,
          nearest: n,
          fraction: n.fraction
        });
        Flotr.EventAdapter.fire(mt, 'flotr:hit', [n, this]);
      }
      else if(prevHit){
        D.hide(mt);
        this.clearHit();
      }
    }
    else if(this.prevHit) {
      D.hide(this.mouseTrack);
      this.clearHit();
    }
  },
  getMouseTrack: function() {
    if (!this.mouseTrack) {
      this.mouseTrack = D.node('<div class="flotr-mouse-value"></div>');
      D.insert(this.el, this.mouseTrack);
    }
    return this.mouseTrack;
  },
  drawTooltip: function(content, x, y, options) {
    var mt = this.getMouseTrack(),
        style = 'opacity:0.7;background-color:#000;color:#fff;display:none;position:absolute;padding:2px 8px;-moz-border-radius:4px;border-radius:4px;white-space:nowrap;', 
        p = options.position, 
        m = options.margin,
        plotOffset = this.plotOffset;

    if(x !== null && y !== null){
      if (!options.relative) { // absolute to the canvas
             if(p.charAt(0) == 'n') style += 'top:' + (m + plotOffset.top) + 'px;bottom:auto;';
        else if(p.charAt(0) == 's') style += 'bottom:' + (m + plotOffset.bottom) + 'px;top:auto;';
             if(p.charAt(1) == 'e') style += 'right:' + (m + plotOffset.right) + 'px;left:auto;';
        else if(p.charAt(1) == 'w') style += 'left:' + (m + plotOffset.left) + 'px;right:auto;';
      }
      else { // relative to the mouse
             if(p.charAt(0) == 'n') style += 'bottom:' + (m - plotOffset.top - y + this.canvasHeight) + 'px;top:auto;';
        else if(p.charAt(0) == 's') style += 'top:' + (m + plotOffset.top + y) + 'px;bottom:auto;';
             if(p.charAt(1) == 'e') style += 'left:' + (m + plotOffset.left + x) + 'px;right:auto;';
        else if(p.charAt(1) == 'w') style += 'right:' + (m - plotOffset.left - x + this.canvasWidth) + 'px;left:auto;';
      }
  
      mt.style.cssText = style;
      D.empty(mt);
      D.insert(mt, content);
      D.show(mt);
    }
    else {
      D.hide(mt);
    }
  },
  saveImage: function (type, width, height, replaceCanvas) {
    var image = null;
    if (Flotr.isIE && Flotr.isIE < 9) {
      image = '<html><body>'+this.canvas.firstChild.innerHTML+'</body></html>';
      return window.open().document.write(image);
    }
      
    switch (type) {
      case 'jpeg':
      case 'jpg': image = Canvas2Image.saveAsJPEG(this.canvas, replaceCanvas, width, height); break;
      default:
      case 'png': image = Canvas2Image.saveAsPNG(this.canvas, replaceCanvas, width, height); break;
      case 'bmp': image = Canvas2Image.saveAsBMP(this.canvas, replaceCanvas, width, height); break;
    }
    if (_.isElement(image) && replaceCanvas) {
      this.restoreCanvas();
      D.hide(this.canvas);
      D.hide(this.overlay);
      D.setStyles({position: 'absolute'});
      D.insert(this.el, image);
      this.saveImageElement = image;
    }
  },
  restoreCanvas: function() {
    D.show(this.canvas);
    D.show(this.overlay);
    this.canvas.show();
    this.overlay.show();
    if (this.saveImageElement) this.el.removeChild(this.saveImageElement);
    this.saveImageElement = null;
  }
}
})();

/** Lines **/
Flotr.addType('lines', {
  options: {
    show: false,           // => setting to true will show lines, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: false,           // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    stacked: false         // => setting to true will show stacked lines, false will show normal lines
  },
  /**
   * Draws lines series in the canvas element.
   * @param {Object} series - Series with options.lines.show = true.
   */
  draw: function(series){
    series = series || this.series;
    var ctx = this.ctx;
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'round';

    var lw = series.lines.lineWidth;
    var sw = series.shadowSize;

    if(sw > 0){
      ctx.lineWidth = sw / 2;

      var offset = lw/2 + ctx.lineWidth/2;
      
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      this.lines.plot(series, offset + sw/2, false);

      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      this.lines.plot(series, offset, false);

      if(series.lines.fill) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        this.lines.plotArea(series, offset + sw/2, false);
      }
    }

    ctx.lineWidth = lw;
    ctx.strokeStyle = series.color;
    if(series.lines.fill){
      ctx.fillStyle = this.processColor(series.lines.fillColor || series.color, {opacity: series.lines.fillOpacity});
      this.lines.plotArea(series, 0, true);
    }

    this.lines.plot(series, 0, true);
    ctx.restore();
  },  
  plot: function(series, offset, incStack){
    var ctx = this.ctx,
        xa = series.xaxis,
        ya = series.yaxis,
        data = series.data, 
        length = data.length - 1, i;
      
    if(data.length < 2) return;

    var plotWidth = this.plotWidth, 
        plotHeight = this.plotHeight,
        prevx = null,
        prevy = null;

    ctx.beginPath();
    for(i = 0; i < length; ++i){
      // To allow empty values
      if (data[i][1] === null || data[i+1][1] === null) continue;
            
            // Zero is infinity for log scales
            if (xa.options.scaling === 'logarithmic' && (data[i][0] <= 0 || data[i+1][0] <= 0)) continue;
            if (ya.options.scaling == 'logarithmic' && (data[i][1] <= 0 || data[i+1][1] <= 0)) continue;
      
      var x1 = xa.d2p(data[i][0]),   y1,
          x2 = xa.d2p(data[i+1][0]), y2;
      
      if (series.lines.stacked) {
        var stack1 = xa.values[data[i][0]].stack || 0,
            stack2 = xa.values[data[i+1][0]].stack || xa.values[data[i][0]].stack || 0;
        
        y1 = ya.d2p(data[i][1] + stack1);
        y2 = ya.d2p(data[i+1][1] + stack2);
        
        if(incStack){
          xa.values[data[i][0]].stack = data[i][1]+stack1;
            
          if(i == length-1){
            xa.values[data[i+1][0]].stack = data[i+1][1]+stack2;
          }
        }
      }
      else{
        y1 = ya.d2p(data[i][1]);
        y2 = ya.d2p(data[i+1][1]);
      }

      /**
       * Clip against graph bottom edge.
       */
      if(y1 >= y2 && y1 >= plotHeight){
        /**
         * Line segment is outside the drawing area.
         */
        if(y2 >= plotHeight) continue;
        
        /**
         * Compute new intersection point.
         */
        x1 = x1 - (y1 - plotHeight - 1) / (y2 - y1) * (x2 - x1);
        y1 = plotHeight - 1;
      }
      else if(y2 >= y1 && y2 >= plotHeight){
        if(y1 >= plotHeight) continue;
        x2 = x1 - (y1 - plotHeight - 1) / (y2 - y1) * (x2 - x1);
        y2 = plotHeight - 1;
      }

      /**
       * Clip against graph top edge.
       */ 
      if(y1 <= y2 && y1 < 0) {
        if(y2 < 0) continue;
        x1 = x1 - y1 / (y2 - y1) * (x2 - x1);
        y1 = 0;
      }
      else if(y2 <= y1 && y2 < 0){
        if(y1 < 0) continue;
        x2 = x1 - y1 / (y2 - y1) * (x2 - x1);
        y2 = 0;
      }

      /**
       * Clip against graph left edge.
       */
      if(x1 <= x2 && x1 < 0){
        if(x2 < 0) continue;
        y1 = y1 - x1 / (x2 - x1) * (y2 - y1);
        x1 = 0;
      }
      else if(x2 <= x1 && x2 < 0){
        if(x1 < 0) continue;
        y2 = y1 - x1 / (x2 - x1) * (y2 - y1);
        x2 = 0;
      }

      /**
       * Clip against graph right edge.
       */
      if(x1 >= x2 && x1 >= plotWidth){
        if (x2 >= plotWidth) continue;
        y1 = y1 + (plotWidth - x1) / (x2 - x1) * (y2 - y1);
        x1 = plotWidth - 1;
      }
      else if(x2 >= x1 && x2 >= plotWidth){
        if(x1 >= plotWidth) continue;
        y2 = y1 + (plotWidth - x1) / (x2 - x1) * (y2 - y1);
        x2 = plotWidth - 1;
      }

      if((prevx != x1) || (prevy != y1 + offset))
        ctx.moveTo(x1, y1 + offset);
      
      prevx = x2;
      prevy = y2 + offset;
      ctx.lineTo(prevx, prevy);
    }
    
    ctx.stroke();
    ctx.closePath();
  },
  /**
   * Function used to fill
   * @param {Object} series - The series to draw
   * @param {Object} offset
   */
  plotArea: function(series, offset, saveStrokePath){
    var ctx = this.ctx,
        xa = series.xaxis,
        ya = series.yaxis,
        data = series.data,
        length = data.length - 1,
        top, 
        bottom = Math.min(Math.max(0, ya.min), ya.max),
        lastX = 0,
        first = true,
        strokePath = [],
        pathIdx = 0,
        stack1 = 0,
        stack2 = 0;
    
    function addStrokePath(xVal, yVal) {
      if (saveStrokePath) {
        strokePath[pathIdx] = [];
        strokePath[pathIdx][0] = xVal;
        strokePath[pathIdx][1] = yVal;
        pathIdx++;
      }
    }
      
    if(data.length < 2) return;
    
    ctx.beginPath();
    
    for(var i = 0; i < length; ++i){
      var x1 = data[i][0],   y1,
          x2 = data[i+1][0], y2;
      
      if (series.lines.stacked) {
        var stack1 = xa.values[data[i][0]].stack || 0,
            stack2 = xa.values[data[i+1][0]].stack || xa.values[data[i][0]].stack || 0;
        
        y1 = data[i][1] + stack1;
        y2 = data[i+1][1] + stack2;
      }
      else{
        y1 = data[i][1];
        y2 = data[i+1][1];
      }
      
      if(x1 <= x2 && x1 < xa.min){
        if(x2 < xa.min) continue;
        y1 = (xa.min - x1) / (x2 - x1) * (y2 - y1) + y1;
        x1 = xa.min;
      }
      else if(x2 <= x1 && x2 < xa.min){
        if(x1 < xa.min) continue;
        y2 = (xa.min - x1) / (x2 - x1) * (y2 - y1) + y1;
        x2 = xa.min;
      }
                
      if(x1 >= x2 && x1 > xa.max){
        if(x2 > xa.max) continue;
        y1 = (xa.max - x1) / (x2 - x1) * (y2 - y1) + y1;
        x1 = xa.max;
      }
      else if(x2 >= x1 && x2 > xa.max){
        if (x1 > xa.max) continue;
        y2 = (xa.max - x1) / (x2 - x1) * (y2 - y1) + y1;
        x2 = xa.max;
      }
      var x1PointValue = xa.d2p(x1), // Cache d2p values
          x2PointValue = xa.d2p(x2),
          yaMaxPointValue = ya.d2p(ya.max),
          yaMinPointValue = ya.d2p(ya.min);
      
      if(first){
        ctx.moveTo(x1PointValue, ya.d2p(bottom + stack1) + offset);
        addStrokePath(x1PointValue, ya.d2p(bottom + stack1) + offset);
        first = false;
      }
      lastX = Math.max(x2, lastX);
      
      /**
       * Now check the case where both is outside.
       */
      if(y1 >= ya.max && y2 >= ya.max){
        ctx.lineTo(x1PointValue, yaMaxPointValue + offset);
        ctx.lineTo(x2PointValue, yaMaxPointValue + offset);
        addStrokePath(x1PointValue, yaMaxPointValue + offset);
        addStrokePath(x2PointValue, yaMaxPointValue + offset);
        continue;
      }
      else if(y1 <= ya.min && y2 <= ya.min){
        ctx.lineTo(x1PointValue, yaMinPointValue + offset);
        ctx.lineTo(x2PointValue, yaMinPointValue + offset);
        addStrokePath(x1PointValue, yaMinPointValue + offset);
        addStrokePath(x2PointValue, yaMinPointValue + offset);
        continue;
      }
      
      /**
       * Else it's a bit more complicated, there might
       * be two rectangles and two triangles we need to fill
       * in; to find these keep track of the current x values.
       */
      var x1old = x1, x2old = x2;
      
      /**
       * And clip the y values, without shortcutting.
       * Clip with ymin.
       */
      if(y1 <= y2 && y1 < ya.min && y2 >= ya.min){
        x1 = (ya.min - y1) / (y2 - y1) * (x2 - x1) + x1;
        y1 = ya.min;
      }
      else if(y2 <= y1 && y2 < ya.min && y1 >= ya.min){
        x2 = (ya.min - y1) / (y2 - y1) * (x2 - x1) + x1;
        y2 = ya.min;
      }

      /**
       * Clip with ymax.
       */
      if(y1 >= y2 && y1 > ya.max && y2 <= ya.max){
        x1 = (ya.max - y1) / (y2 - y1) * (x2 - x1) + x1;
        y1 = ya.max;
      }
      else if(y2 >= y1 && y2 > ya.max && y1 <= ya.max){
        x2 = (ya.max - y1) / (y2 - y1) * (x2 - x1) + x1;
        y2 = ya.max;
      }

      var x1NewPointValue = xa.d2p(x1), // Cache d2p values
          x2NewPointValue = xa.d2p(x2),
          y1PointValue = ya.d2p(y1), 
          y2PointValue = ya.d2p(y2);
      
      /**
       * If the x value was changed we got a rectangle to fill.
       */
      if(x1 != x1old){
        top = (y1 <= ya.min) ? yaMinPointValue : yaMaxPointValue;
        ctx.lineTo(x1PointValue, top + offset);
        ctx.lineTo(x1NewPointValue, top + offset);
        addStrokePath(x1PointValue, top + offset);
        addStrokePath(x1NewPointValue, top + offset);
      }
         
      /**
       * Fill the triangles.
       */
      ctx.lineTo(x1NewPointValue, y1PointValue + offset);
      ctx.lineTo(x2NewPointValue, y2PointValue + offset);
      addStrokePath(x1NewPointValue, y1PointValue + offset);
      addStrokePath(x2NewPointValue, y2PointValue + offset);

      /**
       * Fill the other rectangle if it's there.
       */
      if(x2 != x2old){
        top = (y2 <= ya.min) ? yaMinPointValue : yaMaxPointValue;
        ctx.lineTo(x2PointValue, top + offset);
        addStrokePath(x2PointValue, top + offset);
      }

      lastX = Math.max(x2, x2old, lastX);
    }
    
    ctx.lineTo(xa.d2p(lastX), ya.d2p(bottom) + offset);
    addStrokePath(xa.d2p(lastX), ya.d2p(bottom) + offset);
    
    // go back along previous stroke path
    var path = xa.lastStrokePath;
    
    if (series.lines.stacked) {
      if (path) {
        for(var i = path.length-1; i >= 0; --i){
          ctx.lineTo(path[i][0], path[i][1] - offset/2);
        }
      }
      // add stroke path to series data
      if (saveStrokePath) {
        xa.lastStrokePath = strokePath;
      }
    }
    
    ctx.closePath();
    ctx.fill();
  },
  extendYRange: function(axis){
    if(axis.options.max == null || axis.options.min == null){
      var newmax = axis.max,
          newmin = axis.min,
          x, i, j, s, l,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;
                  
      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        l = s.lines;
        if (l.show && !s.hide && s.yaxis == axis) {
          // For stacked lines
          if(l.stacked){
            for (j = 0; j < s.data.length; j++) {
              x = s.data[j][0]+'';
              if(s.data[j][1]>0)
                stackedSumsPos[x] = (stackedSumsPos[x] || 0) + s.data[j][1];
              else
                stackedSumsNeg[x] = (stackedSumsNeg[x] || 0) + s.data[j][1];
              lastSerie = s;
            }
            
            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
            for (j in stackedSumsNeg) {
              newmin = Math.min(stackedSumsNeg[j], newmin);
            }
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  }
});

/** Bars **/
Flotr.addType('bars', {
  options: {
    show: false,           // => setting to true will show bars, false will hide
    lineWidth: 2,          // => in pixels
    barWidth: 1,           // => in units of the x axis
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    horizontal: false,     // => horizontal bars (x and y inverted) @todo: needs fix
    stacked: false,        // => stacked bar charts
    centered: true         // => center the bars to their x axis value
  },
  /**
   * Draws bar series in the canvas element.
   * @param {Object} series - Series with options.bars.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
      bw = series.bars.barWidth,
      lw = Math.min(series.bars.lineWidth, bw);
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'miter';

    /**
     * @todo linewidth not interpreted the right way.
     */
    ctx.lineWidth = lw;
    ctx.strokeStyle = series.color;
    
    ctx.save();
    this.bars.plotShadows(series, bw, 0, series.bars.fill);
    ctx.restore();
    
    if(series.bars.fill){
      var color = series.bars.fillColor || series.color;
      ctx.fillStyle = this.processColor(color, {opacity: series.bars.fillOpacity});
    }
    
    this.bars.plot(series, bw, 0, series.bars.fill);
    ctx.restore();
  },
  plot: function(series, barWidth, offset, fill){
    var data = series.data;
    if(data.length < 1) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx, i;

    for(i = 0; i < data.length; i++){
      var x = data[i][0],
          y = data[i][1],
        drawLeft = true, drawTop = true, drawRight = true;
      
      if (y === null) continue;
      
      // Stacked bars
      var stackOffsetPos = 0;
      var stackOffsetNeg = 0;
      
      if(series.bars.stacked) {
        if(series.bars.horizontal) {
          stackOffsetPos = ya.values[y].stackPos || 0;
          stackOffsetNeg = ya.values[y].stackNeg || 0;
          if(x > 0) {
            ya.values[y].stackPos = stackOffsetPos + x;
          } else {
            ya.values[y].stackNeg = stackOffsetNeg + x;
          }
        } 
        else {
          stackOffsetPos = xa.values[x].stackPos || 0;
          stackOffsetNeg = xa.values[x].stackNeg || 0;
          if(y > 0) {
            xa.values[x].stackPos = stackOffsetPos + y;
          } else {
            xa.values[x].stackNeg = stackOffsetNeg + y;
          }
        }
      }
      
      // @todo: fix horizontal bars support
      // Horizontal bars
      var barOffset = series.bars.centered ? barWidth/2 : 0;
      
      if(series.bars.horizontal){ 
        if (x > 0)
          var left = stackOffsetPos, right = x + stackOffsetPos;
        else
          var right = stackOffsetNeg, left = x + stackOffsetNeg;
          
        var bottom = y - barOffset, top = y + barWidth - barOffset;
      }
      else {
        if (y > 0)
          var bottom = stackOffsetPos, top = y + stackOffsetPos;
        else
          var top = stackOffsetNeg, bottom = y + stackOffsetNeg;
          
        var left = x - barOffset, right = x + barWidth - barOffset;
      }
      
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;

      if(left < xa.min){
        left = xa.min;
        drawLeft = false;
      }

      if(right > xa.max){
        right = xa.max;
        if (xa.lastSerie != series && series.bars.horizontal)
          drawTop = false;
      }

      if(bottom < ya.min)
        bottom = ya.min;

      if(top > ya.max){
        top = ya.max;
        if (ya.lastSerie != series && !series.bars.horizontal)
          drawTop = false;
      }
      
      // Cache d2p values
      var xaLeft   = xa.d2p(left),
          xaRight  = xa.d2p(right),
          yaTop    = ya.d2p(top), 
          yaBottom = ya.d2p(bottom);

      /**
       * Fill the bar.
       */
      if(fill){
        ctx.fillRect(xaLeft, yaTop, xaRight - xaLeft, yaBottom - yaTop);
      }

      /**
       * Draw bar outline/border.
       * @todo  Optimize this with rect method ?
       * @todo  Can we move stroke, beginPath, closePath out of the main loop?
       *        Not sure if rect screws this up.
       */
      if(series.bars.lineWidth != 0 && (drawLeft || drawRight || drawTop)){
        ctx.beginPath();
        ctx.moveTo(xaLeft, yaBottom + offset);
        
        ctx[drawLeft ?'lineTo':'moveTo'](xaLeft, yaTop + offset);
        ctx[drawTop  ?'lineTo':'moveTo'](xaRight, yaTop + offset);
        ctx[drawRight?'lineTo':'moveTo'](xaRight, yaBottom + offset);
                 
        ctx.stroke();
        ctx.closePath();
      }
    }
  },
  plotShadows: function(series, barWidth, offset){
    var data = series.data;
    if(data.length < 1) return;
    
    var i, x, y, 
        xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        sw = this.options.shadowSize;
    
    for(i = 0; i < data.length; i++){
      x = data[i][0];
        y = data[i][1];
        
      if (y === null) continue;
      
      // Stacked bars
      var stackOffsetPos = 0;
      var stackOffsetNeg = 0;
      
      // TODO reconcile this with the same logic in Plot, maybe precalc
      if(series.bars.stacked) {
        if(series.bars.horizontal) {
          stackOffsetPos = ya.values[y].stackShadowPos || 0;
          stackOffsetNeg = ya.values[y].stackShadowNeg || 0;
          if(x > 0) {
            ya.values[y].stackShadowPos = stackOffsetPos + x;
          } else {
            ya.values[y].stackShadowNeg = stackOffsetNeg + x;
          }
        }
        else {
          stackOffsetPos = xa.values[x].stackShadowPos || 0;
          stackOffsetNeg = xa.values[x].stackShadowNeg || 0;
          if(y > 0) {
            xa.values[x].stackShadowPos = stackOffsetPos + y;
          } else {
            xa.values[x].stackShadowNeg = stackOffsetNeg + y;
          }
        }
      }
      
      // Horizontal bars
      var barOffset = series.bars.centered ? barWidth/2 : 0;
      
      if(series.bars.horizontal){
        if (x > 0)
          var left = stackOffsetPos, right = x + stackOffsetPos;
        else
          var right = stackOffsetNeg, left = x + stackOffsetNeg;
          
        var bottom = y- barOffset, top = y + barWidth - barOffset;
      }
      else {
        if (y > 0)
          var bottom = stackOffsetPos, top = y + stackOffsetPos;
        else
          var top = stackOffsetNeg, bottom = y + stackOffsetNeg;
          
        var left = x - barOffset, right = x + barWidth - barOffset;
      }
      
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;
      
      if(left < xa.min)   left = xa.min;
      if(right > xa.max)  right = xa.max;
      if(bottom < ya.min) bottom = ya.min;
      if(top > ya.max)    top = ya.max;
      
      var width =  xa.d2p(right)-xa.d2p(left)-((xa.d2p(right)+sw <= this.plotWidth) ? 0 : sw);
      var height = ya.d2p(bottom)-ya.d2p(top)-((ya.d2p(bottom)+sw <= this.plotHeight) ? 0 : sw );
      
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(Math.min(xa.d2p(left)+sw, this.plotWidth), Math.min(ya.d2p(top)+sw, this.plotHeight), width, height);
    }
  },
  extendXRange: function(axis) {
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, x, s, b,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;

      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        b = s.bars;
        if(b.show && s.xaxis == axis) {
          if (b.centered && !b.horizontal) {
            newmax = Math.max(axis.datamax + 0.5, newmax);
            newmin = Math.min(axis.datamin - 0.5, newmin);
          }
          
          // For normal vertical bars
          if (!b.horizontal && (b.barWidth + axis.datamax > newmax))
            newmax = axis.max + (b.centered ? b.barWidth/2 : b.barWidth);

          // For horizontal stacked bars
          if(b.stacked && b.horizontal){
            for (j = 0; j < s.data.length; j++) {
              if (b.show && b.stacked) {
                y = s.data[j][1]+'';
                
                if(s.data[j][0] > 0)
                  stackedSumsPos[y] = (stackedSumsPos[y] || 0) + s.data[j][0];
                else
                  stackedSumsNeg[y] = (stackedSumsNeg[y] || 0) + s.data[j][0];
                  
                lastSerie = s;
              }
            }

            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
            for (j in stackedSumsNeg) {
              newmin = Math.min(stackedSumsNeg[j], newmin);
            }
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  },
  extendYRange: function(axis){
    if(axis.options.max == null){
      var newmax = axis.max,
          newmin = axis.min,
          x, i, j, s, b,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;
                  
      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        b = s.bars;
        if (b.show && !s.hide && s.yaxis == axis) {
          if (b.centered && b.horizontal) {
            newmax = Math.max(axis.datamax + 0.5, newmax);
            newmin = Math.min(axis.datamin - 0.5, newmin);
          }
              
          // For normal horizontal bars
          if (b.horizontal && (b.barWidth + axis.datamax > newmax)){
            newmax = axis.max + b.barWidth;
          }
          
          // For vertical stacked bars
          if(b.stacked && !b.horizontal){
            for (j = 0; j < s.data.length; j++) {
              if (s.bars.show && s.bars.stacked) {
                x = s.data[j][0]+'';
                
                if(s.data[j][1] > 0)
                  stackedSumsPos[x] = (stackedSumsPos[x] || 0) + s.data[j][1];
                else
                  stackedSumsNeg[x] = (stackedSumsNeg[x] || 0) + s.data[j][1];
                  
                lastSerie = s;
              }
            }
            
            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
            for (j in stackedSumsNeg) {
              newmin = Math.min(stackedSumsNeg[j], newmin);
            }
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  },
  drawHit: function (n) {
    var octx = this.octx,
      s = n.series,
      xa = n.xaxis,
      ya = n.yaxis;

    octx.save();
    octx.translate(this.plotOffset.left, this.plotOffset.top);
    octx.beginPath();
    
    if (s.mouse.trackAll) {
      octx.moveTo(xa.d2p(n.x), ya.d2p(0));
      octx.lineTo(xa.d2p(n.x), ya.d2p(n.yaxis.max));
    }
    else {
      var bw = s.bars.barWidth,
        y = ya.d2p(n.y), 
        x = xa.d2p(n.x);
        
      if(!s.bars.horizontal){ //vertical bars (default)
        var ly = ya.d2p(ya.min<0? 0 : ya.min); //lower vertex y value (in points)
        
        if(s.bars.centered){
          var lx = xa.d2p(n.x-(bw/2)),
            rx = xa.d2p(n.x+(bw/2));
        
          octx.moveTo(lx, ly);
          octx.lineTo(lx, y);
          octx.lineTo(rx, y);
          octx.lineTo(rx, ly);
        } else {
          var rx = xa.d2p(n.x+bw); //right vertex x value (in points)
          
          octx.moveTo(x, ly);
          octx.lineTo(x, y);
          octx.lineTo(rx, y);
          octx.lineTo(rx, ly);
        }
      } else { //horizontal bars
        var lx = xa.d2p(xa.min<0? 0 : xa.min); //left vertex y value (in points)
          
        if(s.bars.centered){
          var ly = ya.d2p(n.y-(bw/2)),
            uy = ya.d2p(n.y+(bw/2));
                       
          octx.moveTo(lx, ly);
          octx.lineTo(x, ly);
          octx.lineTo(x, uy);
          octx.lineTo(lx, uy);
        } else {
          var uy = ya.d2p(n.y+bw); //upper vertex y value (in points)
        
          octx.moveTo(lx, y);
          octx.lineTo(x, y);
          octx.lineTo(x, uy);
          octx.lineTo(lx, uy);
        }
      }

      if(s.mouse.fillColor) octx.fill();
    }

    octx.stroke();
    octx.closePath();
    octx.restore();
  },
  clearHit: function() {
    var prevHit = this.prevHit,
      plotOffset = this.plotOffset,
      s = prevHit.series,
      xa = prevHit.xaxis,
      ya = prevHit.yaxis,
      lw = s.bars.lineWidth,
      bw = s.bars.barWidth;
        
    if(!s.bars.horizontal){ // vertical bars (default)
      var lastY = ya.d2p(prevHit.y >= 0 ? prevHit.y : 0);
      if(s.bars.centered) {
        this.octx.clearRect(
            xa.d2p(prevHit.x - bw/2) + plotOffset.left - lw, 
            lastY + plotOffset.top - lw, 
            xa.d2p(bw + xa.min) + lw * 2, 
            ya.d2p(prevHit.y < 0 ? prevHit.y : 0) - lastY + lw * 2
        );
      } else {
        this.octx.clearRect(
            xa.d2p(prevHit.x) + plotOffset.left - lw, 
            lastY + plotOffset.top - lw, 
            xa.d2p(bw + xa.min) + lw * 2, 
            ya.d2p(prevHit.y < 0 ? prevHit.y : 0) - lastY + lw * 2
        ); 
      }
    } else { // horizontal bars
      var lastX = xa.d2p(prevHit.x >= 0 ? prevHit.x : 0);
      if(s.bars.centered) {
        this.octx.clearRect(
            lastX + plotOffset.left + lw, 
            ya.d2p(prevHit.y + bw/2) + plotOffset.top - lw, 
            xa.d2p(prevHit.x < 0 ? prevHit.x : 0) - lastX - lw*2,
            ya.d2p(bw + ya.min) + lw * 2
        );
      } else {
        this.octx.clearRect(
            lastX + plotOffset.left + lw, 
            ya.d2p(prevHit.y + bw) + plotOffset.top - lw, 
            xa.d2p(prevHit.x < 0 ? prevHit.x : 0) - lastX - lw*2,
            ya.d2p(bw + ya.min) + lw * 2
        );
      }
    }
  },
  findAxesValues: function(s){
    this.findXAxesValues(s);
    if(s.bars.show && s.bars.horizontal && s.bars.stacked)
      this.findYAxesValues(s);
  }
});

/** Bubbles **/
Flotr.addType('bubbles', {
  options: {
    show: false,      // => setting to true will show radar chart, false will hide
    lineWidth: 2,     // => line width in pixels
    fill: true,       // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillOpacity: 0.4, // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    baseRadius: 2     // => ratio of the radar, against the plot size
  },
  draw: function(series){
    var ctx = this.ctx,
        options = this.options;
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineWidth = series.bubbles.lineWidth;
    
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    this.bubbles.plot(series, series.shadowSize / 2);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    this.bubbles.plot(series, series.shadowSize / 4);
    
    ctx.strokeStyle = series.color;
    ctx.fillStyle = this.processColor(series.color, {opacity: series.radar.fillOpacity});
    this.bubbles.plot(series);
    
    ctx.restore();
  },
  plot: function(series, offset){
    var ctx = this.ctx,
        options = this.options,
        data = series.data,
        radius = options.bubbles.baseRadius;
        
    offset = offset || 0;
    
    for(var i = 0; i < data.length; ++i){
      var x = data[i][0],
          y = data[i][1],
          z = data[i][2];
          
      ctx.beginPath();
      ctx.arc(series.xaxis.d2p(x) + offset, series.yaxis.d2p(y) + offset, radius * z, 0, Math.PI*2, true);
      ctx.stroke();
      if (series.bubbles.fill) ctx.fill();
      ctx.closePath();
    }
  },
  drawHit: function(n){

    var octx = this.octx,
        s = n.series,
        xa = n.xaxis,
        ya = n.yaxis,
        z = s.data[0][2],
        r = this.options.bubbles.baseRadius;

    octx.save();
    octx.lineWidth = s.points.lineWidth;
    octx.strokeStyle = s.mouse.lineColor;
    octx.fillStyle = this.processColor(s.mouse.fillColor || '#ffffff', {opacity: s.mouse.fillOpacity});

    octx.translate(this.plotOffset.left, this.plotOffset.top);
    octx.beginPath();
      octx.arc(xa.d2p(n.x), ya.d2p(n.y), z*r, 0, 2 * Math.PI, true);
      octx.fill();
      octx.stroke();
    octx.closePath();
    octx.restore();
  },
  clearHit: function(){
    var prevHit = this.prevHit,
        plotOffset = this.plotOffset,
        s = prevHit.series,
        lw = s.bars.lineWidth,
        xa = prevHit.xaxis,
        ya = prevHit.yaxis,
        z = s.data[0][2],
        r = this.options.bubbles.baseRadius,
        offset = z*r+lw;

    this.octx.clearRect(
      plotOffset.left + xa.d2p(prevHit.x) - offset,
      plotOffset.top  + ya.d2p(prevHit.y) - offset,
      offset*2,
      offset*2
    );
  }

/*,
  extendXRange: function(axis){
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, c, r, data, d;
          
      for(i = 0; i < this.series.length; ++i){
        c = this.series[i].bubbles;
        if(c.show && this.series[i].xaxis == axis) {
          data = this.series[i].data;
          if (data)
          for(j = 0; j < data.length; j++) {
            d = data[j];
            r = d[2] * c.baseRadius * (this.plotWidth / (axis.datamax - axis.datamin));
              newmax = Math.max(d[0] + r, newmax);
              newmin = Math.min(d[0] - r, newmin);
          }
        }
      }
      axis.max = newmax;
      axis.min = newmin;
    }
  },
  extendYRange: function(axis){
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, c, r, data, d;

      for(i = 0; i < this.series.length; ++i){
        c = this.series[i].bubbles;
        if(c.show && this.series[i].yaxis == axis) {
          data = this.series[i].data;
          if (data)
          for(j = 0; j < data.length; j++) {
            d = data[j];
            r = d[2] * c.baseRadius;
            newmax = Math.max(d[1] + r, newmax);
            newmin = Math.min(d[1] - r, newmin);
          }
        }
      }
      axis.max = newmax;
      axis.min = newmin;
    }
  }*/
});

/** Candles **/
Flotr.addType('candles', {
  options: {
    show: false,           // => setting to true will show candle sticks, false will hide
    lineWidth: 1,          // => in pixels
    wickLineWidth: 1,      // => in pixels
    candleWidth: 0.6,      // => in units of the x axis
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    upFillColor: '#00A8F0',// => up sticks fill color
    downFillColor: '#CB4B4B',// => down sticks fill color
    fillOpacity: 0.5,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    barcharts: false       // => draw as barcharts (not standard bars but financial barcharts)
  },
  /**
   * Draws candles series in the canvas element.
   * @param {Object} series - Series with options.candles.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
        bw = series.candles.candleWidth;
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'miter';

    /**
     * @todo linewidth not interpreted the right way.
     */
    ctx.lineWidth = series.candles.lineWidth;
    this.candles.plotShadows(series, bw/2);
    this.candles.plot(series, bw/2);
    
    ctx.restore();
  },
  plot: function(series, offset){
    var data = series.data;
    if(data.length < 1) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx;

    for(var i = 0; i < data.length; i++){
      var d     = data[i],
          x     = d[0],
          open  = d[1],
          high  = d[2],
          low   = d[3],
          close = d[4];

      var left    = x - series.candles.candleWidth/2,
          right   = x + series.candles.candleWidth/2,
          bottom  = Math.max(ya.min, low),
          top     = Math.min(ya.max, high),
          bottom2 = Math.max(ya.min, Math.min(open, close)),
          top2    = Math.min(ya.max, Math.max(open, close));

      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;

      var color = series.candles[open>close?'downFillColor':'upFillColor'];
      /**
       * Fill the candle.
       */
      if(series.candles.fill && !series.candles.barcharts){
        ctx.fillStyle = this.processColor(color, {opacity: series.candles.fillOpacity});
        ctx.fillRect(xa.d2p(left), ya.d2p(top2) + offset, xa.d2p(right) - xa.d2p(left), ya.d2p(bottom2) - ya.d2p(top2));
      }

      /**
       * Draw candle outline/border, high, low.
       */
      if(series.candles.lineWidth || series.candles.wickLineWidth){
        var x, y, pixelOffset = (series.candles.wickLineWidth % 2) / 2;

        x = Math.floor(xa.d2p((left + right) / 2)) + pixelOffset;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = series.candles.wickLineWidth;
        ctx.lineCap = 'butt';
        
        if (series.candles.barcharts) {
          ctx.beginPath();
          
          ctx.moveTo(x, Math.floor(ya.d2p(top) + offset));
          ctx.lineTo(x, Math.floor(ya.d2p(bottom) + offset));
          
          y = Math.floor(ya.d2p(open) + offset)+0.5;
          ctx.moveTo(Math.floor(xa.d2p(left))+pixelOffset, y);
          ctx.lineTo(x, y);
          
          y = Math.floor(ya.d2p(close) + offset)+0.5;
          ctx.moveTo(Math.floor(xa.d2p(right))+pixelOffset, y);
          ctx.lineTo(x, y);
        } 
        else {
          ctx.strokeRect(xa.d2p(left), ya.d2p(top2) + offset, xa.d2p(right) - xa.d2p(left), ya.d2p(bottom2) - ya.d2p(top2));
          
          ctx.beginPath();
          ctx.moveTo(x, Math.floor(ya.d2p(top2   ) + offset));
          ctx.lineTo(x, Math.floor(ya.d2p(top    ) + offset));
          ctx.moveTo(x, Math.floor(ya.d2p(bottom2) + offset));
          ctx.lineTo(x, Math.floor(ya.d2p(bottom ) + offset));
        }
        
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }
  },
  plotShadows: function(series, offset){
    var data = series.data;
    if(data.length < 1 || series.candles.barcharts) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        sw = this.options.shadowSize;
    
    for(var i = 0; i < data.length; i++){
      var d     = data[i],
          x     = d[0],
          open  = d[1],
          high  = d[2],
          low   = d[3],
          close = d[4];
      
      var left   = x - series.candles.candleWidth/2,
          right  = x + series.candles.candleWidth/2,
          bottom = Math.max(ya.min, Math.min(open, close)),
          top    = Math.min(ya.max, Math.max(open, close));
      
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;
      
      var width =  xa.d2p(right)-xa.d2p(left)-((xa.d2p(right)+sw <= this.plotWidth) ? 0 : sw);
      var height = Math.max(0, ya.d2p(bottom)-ya.d2p(top)-((ya.d2p(bottom)+sw <= this.plotHeight) ? 0 : sw));
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
      this.ctx.fillRect(Math.min(xa.d2p(left)+sw, this.plotWidth), Math.min(ya.d2p(top)+sw, this.plotWidth), width, height);
    }
  },
  extendXRange: function(axis){
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, c;

      for(i = 0; i < this.series.length; ++i){
        c = this.series[i].candles;
        if(c.show && this.series[i].xaxis == axis) {
          // We don't use c.candleWidth in order not to stick the borders
          newmax = Math.max(axis.datamax + 0.5, newmax);
          newmin = Math.min(axis.datamin - 0.5, newmin);
        }
      }
      axis.max = newmax;
      axis.min = newmin;
    }
  }
});

/** Gantt
 * Base on data in form [s,y,d] where:
 * y - executor or simply y value
 * s - task start value
 * d - task duration
 * **/
Flotr.addType('gantt', {
  options: {
    show: false,           // => setting to true will show gantt, false will hide
    lineWidth: 2,          // => in pixels
    barWidth: 1,           // => in units of the x axis
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    centered: true         // => center the bars to their x axis value
  },
  /**
   * Draws gantt series in the canvas element.
   * @param {Object} series - Series with options.gantt.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
      bw = series.gantt.barWidth,
      lw = Math.min(series.gantt.lineWidth, bw);
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'miter';

    /**
     * @todo linewidth not interpreted the right way.
     */
    ctx.lineWidth = lw;
    ctx.strokeStyle = series.color;
    
    ctx.save();
    this.gantt.plotShadows(series, bw, 0, series.gantt.fill);
    ctx.restore();
    
    if(series.gantt.fill){
      var color = series.gantt.fillColor || series.color;
      ctx.fillStyle = this.processColor(color, {opacity: series.gantt.fillOpacity});
    }
    
    this.gantt.plot(series, bw, 0, series.gantt.fill);
    ctx.restore();
  },
  plot: function(series, barWidth, offset, fill){
    var data = series.data;
    if(data.length < 1) return;
    
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx, i;

    for(i = 0; i < data.length; i++){
      var y = data[i][0],
          s = data[i][1],
          d = data[i][2],
          drawLeft = true, drawTop = true, drawRight = true;
      
      if (s === null || d === null) continue;

      var left = s, 
          right = s + d,
          bottom = y - (series.gantt.centered ? barWidth/2 : 0), 
          top = y + barWidth - (series.gantt.centered ? barWidth/2 : 0);
      
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;

      if(left < xa.min){
        left = xa.min;
        drawLeft = false;
      }

      if(right > xa.max){
        right = xa.max;
        if (xa.lastSerie != series)
          drawTop = false;
      }

      if(bottom < ya.min)
        bottom = ya.min;

      if(top > ya.max){
        top = ya.max;
        if (ya.lastSerie != series)
          drawTop = false;
      }
      
      /**
       * Fill the bar.
       */
      if(fill){
        ctx.beginPath();
        ctx.moveTo(xa.d2p(left), ya.d2p(bottom) + offset);
        ctx.lineTo(xa.d2p(left), ya.d2p(top) + offset);
        ctx.lineTo(xa.d2p(right), ya.d2p(top) + offset);
        ctx.lineTo(xa.d2p(right), ya.d2p(bottom) + offset);
        ctx.fill();
        ctx.closePath();
      }

      /**
       * Draw bar outline/border.
       */
      if(series.gantt.lineWidth != 0 && (drawLeft || drawRight || drawTop)){
        ctx.beginPath();
        ctx.moveTo(xa.d2p(left), ya.d2p(bottom) + offset);
        
        ctx[drawLeft ?'lineTo':'moveTo'](xa.d2p(left), ya.d2p(top) + offset);
        ctx[drawTop  ?'lineTo':'moveTo'](xa.d2p(right), ya.d2p(top) + offset);
        ctx[drawRight?'lineTo':'moveTo'](xa.d2p(right), ya.d2p(bottom) + offset);
                 
        ctx.stroke();
        ctx.closePath();
      }
    }
  },
  plotShadows: function(series, barWidth, offset){
    var data = series.data;
    if(data.length < 1) return;
    
    var i, y, s, d,
        xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        sw = this.options.shadowSize;
    
    for(i = 0; i < data.length; i++){
      y = data[i][0];
      s = data[i][1];
      d = data[i][2];
        
      if (s === null || d === null) continue;
            
      var left = s, 
          right = s + d,
          bottom = y - (series.gantt.centered ? barWidth/2 : 0), 
          top = y + barWidth - (series.gantt.centered ? barWidth/2 : 0);
 
      if(right < xa.min || left > xa.max || top < ya.min || bottom > ya.max)
        continue;
      
      if(left < xa.min)   left = xa.min;
      if(right > xa.max)  right = xa.max;
      if(bottom < ya.min) bottom = ya.min;
      if(top > ya.max)    top = ya.max;
      
      var width =  xa.d2p(right)-xa.d2p(left)-((xa.d2p(right)+sw <= this.plotWidth) ? 0 : sw);
      var height = ya.d2p(bottom)-ya.d2p(top)-((ya.d2p(bottom)+sw <= this.plotHeight) ? 0 : sw );
      
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(Math.min(xa.d2p(left)+sw, this.plotWidth), Math.min(ya.d2p(top)+sw, this.plotHeight), width, height);
    }
  },
  extendXRange: function(axis) {
    if(axis.options.max == null){
      var newmin = axis.min,
          newmax = axis.max,
          i, j, x, s, g,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;

      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        g = s.gantt;
        
        if(g.show && s.xaxis == axis) {
            for (j = 0; j < s.data.length; j++) {
              if (g.show) {
                y = s.data[j][0]+'';
                stackedSumsPos[y] = Math.max((stackedSumsPos[y] || 0), s.data[j][1]+s.data[j][2]);
                lastSerie = s;
              }
            }
            for (j in stackedSumsPos) {
              newmax = Math.max(stackedSumsPos[j], newmax);
            }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
    }
  },
  extendYRange: function(axis){
    if(axis.options.max == null){
      var newmax = Number.MIN_VALUE,
          newmin = Number.MAX_VALUE,
          i, j, s, g,
          stackedSumsPos = {},
          stackedSumsNeg = {},
          lastSerie = null;
                  
      for(i = 0; i < this.series.length; ++i){
        s = this.series[i];
        g = s.gantt;
        
        if (g.show && !s.hide && s.yaxis == axis) {
          var datamax = Number.MIN_VALUE, datamin = Number.MAX_VALUE;
          for(j=0; j < s.data.length; j++){
            datamax = Math.max(datamax,s.data[j][0]);
            datamin = Math.min(datamin,s.data[j][0]);
          }
            
          if (g.centered) {
            newmax = Math.max(datamax + 0.5, newmax);
            newmin = Math.min(datamin - 0.5, newmin);
          }
        else {
          newmax = Math.max(datamax + 1, newmax);
            newmin = Math.min(datamin, newmin);
          }
          // For normal horizontal bars
          if (g.barWidth + datamax > newmax){
            newmax = axis.max + g.barWidth;
          }
        }
      }
      axis.lastSerie = lastSerie;
      axis.max = newmax;
      axis.min = newmin;
      axis.tickSize = Flotr.getTickSize(axis.options.noTicks, newmin, newmax, axis.options.tickDecimals);
    }
  }
});

/** Markers **/
/**
 * Formats the marker labels.
 * @param {Object} obj - Marker value Object {x:..,y:..}
 * @return {String} Formatted marker string
 */
Flotr.defaultMarkerFormatter = function(obj){
  return (Math.round(obj.y*100)/100)+'';
};

Flotr.addType('markers', {
  options: {
    show: false,           // => setting to true will show markers, false will hide
    lineWidth: 1,          // => line width of the rectangle around the marker
    fill: false,           // => fill or not the marekers' rectangles
    fillColor: "#FFFFFF",  // => fill color
    fillOpacity: 0.4,      // => fill opacity
    stroke: false,         // => draw the rectangle around the markers
    position: 'ct',        // => the markers position (vertical align: b, m, t, horizontal align: l, c, r)
    labelFormatter: Flotr.defaultMarkerFormatter,
    fontSize: Flotr.defaultOptions.fontSize,
    stacked: false,        // => true if markers should be stacked
    stackingType: 'b',     // => define staching behavior, (b- bars like, a - area like) (see Issue 125 for details)
    horizontal: false      // => true if markers should be horizontal (For now only in a case on horizontal stacked bars, stacks should be calculated horizontaly)
  },
  /**
   * Draws lines series in the canvas element.
   * @param {Object} series - Series with options.lines.show = true.
   */
  draw: function(series){
    series = series || this.series;
    var ctx = this.ctx,
        xa = series.xaxis,
        ya = series.yaxis,
        options = series.markers,
        data = series.data;
        
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    ctx.lineJoin = 'round';
    ctx.lineWidth = options.lineWidth;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = this.processColor(options.fillColor, {opacity: options.fillOpacity});

    for(var i = 0; i < data.length; ++i){
    
      var x = data[i][0],
        y = data[i][1],
        label;
        
      if(series.markers.stacked) {
        if(series.markers.stackingType == 'b'){
          // Stacked bars
          var stackOffsetPos = 0,
            stackOffsetNeg = 0;
            
          if(series.markers.horizontal) {
            stackOffsetPos = ya.values[y].stackMarkPos || 0;
            stackOffsetNeg = ya.values[y].stackMarkNeg || 0;
            if(x > 0) {
              ya.values[y].stackMarkPos = stackOffsetPos + x;
              x = stackOffsetPos + x;
            } else {
              ya.values[y].stackMarkNeg = stackOffsetNeg + x;
              x = stackOffsetNeg + x;
            }
          }
          else {
            stackOffsetPos = xa.values[x].stackMarkPos || 0;
            stackOffsetNeg = xa.values[x].stackMarkNeg || 0;
            if(y > 0) {
              xa.values[x].stackMarkPos = stackOffsetPos + y;
              y = stackOffsetPos + y;
            } else {
              xa.values[x].stackMarkNeg = stackOffsetNeg + y;
              y = stackOffsetNeg + y;
            }
          }
        } else if(series.markers.stackingType == 'a') {
          var stackOffset = xa.values[x].stackMark || 0;
            
          xa.values[x].stackMark = stackOffset + y;
          y = stackOffset + y;
        }
      }
      var xPos = xa.d2p(x),
        yPos = ya.d2p(y);
        label = options.labelFormatter({x: x, y: y, index: i, data : data});

      this.markers.plot(xPos, yPos, label, options);
    }
    
    ctx.restore();
  },
  plot: function(x, y, label, options) {
    var ctx = this.ctx,
        dim = this.getTextDimensions(label, null, null),
        margin = 2,
        left = x,
        top = y;
        
    dim.width = Math.floor(dim.width+margin*2);
    dim.height = Math.floor(dim.height+margin*2);

         if (options.position.indexOf('c') != -1) left -= dim.width/2 + margin;
    else if (options.position.indexOf('l') != -1) left -= dim.width;
    
         if (options.position.indexOf('m') != -1) top -= dim.height/2 + margin;
    else if (options.position.indexOf('t') != -1) top -= dim.height;
    
    left = Math.floor(left)+0.5;
    top = Math.floor(top)+0.5;
    
    if(options.fill)
      ctx.fillRect(left, top, dim.width, dim.height);
      
    if(options.stroke)
      ctx.strokeRect(left, top, dim.width, dim.height);
    
    Flotr.drawText(ctx, label, left+margin, top+margin, {textBaseline: 'top', textAlign: 'left', size: options.fontSize});
  }
});

/** Pie **/
/**
 * Formats the pies labels.
 * @param {Object} slice - Slice object
 * @return {String} Formatted pie label string
 */
Flotr.defaultPieLabelFormatter = function(slice) {
  return (slice.fraction*100).toFixed(2)+'%';
};

Flotr.addType('pie', {
  options: {
    show: false,           // => setting to true will show bars, false will hide
    lineWidth: 1,          // => in pixels
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.6,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    explode: 6,            // => the number of pixels the splices will be far from the center
    sizeRatio: 0.6,        // => the size ratio of the pie relative to the plot 
    startAngle: Math.PI/4, // => the first slice start angle
    labelFormatter: Flotr.defaultPieLabelFormatter,
    pie3D: false,          // => whether to draw the pie in 3 dimenstions or not (ineffective) 
    pie3DviewAngle: (Math.PI/2 * 0.8),
    pie3DspliceThickness: 20
  },
  /**
   * Draws a pie in the canvas element.
   * @param {Object} series - Series with options.pie.show = true.
   */
  draw: function(series) {
    if (this.options.pie.drawn) return;
    var ctx = this.ctx,
        options = this.options,
        lw = series.pie.lineWidth,
        sw = series.shadowSize,
        data = series.data,
        plotOffset = this.plotOffset,
        radius = (Math.min(this.canvasWidth, this.canvasHeight) * series.pie.sizeRatio) / 2,
        html = [],
      vScale = 1,//Math.cos(series.pie.viewAngle);
      plotTickness = Math.sin(series.pie.viewAngle)*series.pie.spliceThickness / vScale,
    
    style = {
      size: options.fontSize*1.2,
      color: options.grid.color,
      weight: 1.5
    },
    
    center = {
      x: plotOffset.left + (this.plotWidth)/2,
      y: plotOffset.top + (this.plotHeight)/2
    },
    
    portions = this.pie._getPortions(),
    slices = this.pie._getSlices(portions, series);

    ctx.save();
    
    if(sw > 0){
      _.each(slices, function (slice) {
        if (slice.startAngle == slice.endAngle) return;
        
        var bisection = (slice.startAngle + slice.endAngle) / 2,
            xOffset = center.x + Math.cos(bisection) * slice.options.explode + sw,
            yOffset = center.y + Math.sin(bisection) * slice.options.explode + sw;
        
        this.pie.plotSlice(xOffset, yOffset, radius, slice.startAngle, slice.endAngle, false, vScale);
        
        if (series.pie.fill) {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fill();
        }
      }, this);
    }
    
    if (options.HtmlText || !this.textEnabled)
      html = [];
    
    _.each(slices, function (slice, index) {
      if (slice.startAngle == slice.endAngle) return;
      
      var bisection = (slice.startAngle + slice.endAngle) / 2,
          color = slice.series.color,
          fillColor = slice.options.fillColor || color,
          xOffset = center.x + Math.cos(bisection) * slice.options.explode,
          yOffset = center.y + Math.sin(bisection) * slice.options.explode;
      
      this.pie.plotSlice(xOffset, yOffset, radius, slice.startAngle, slice.endAngle, false, vScale);
      
      if(series.pie.fill){
        ctx.fillStyle = this.processColor(fillColor, {opacity: series.pie.fillOpacity});
        ctx.fill();
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = color;
      ctx.stroke();
      
      var label = options.pie.labelFormatter(slice),
          textAlignRight = (Math.cos(bisection) < 0),
          textAlignTop = (Math.sin(bisection) > 0),
          explodeCoeff = (slice.options.explode || series.pie.explode) + radius + 4,
          distX = center.x + Math.cos(bisection) * explodeCoeff,
          distY = center.y + Math.sin(bisection) * explodeCoeff;
      
      if (slice.fraction && label) {
        if (options.HtmlText || !this.textEnabled) {
          var yAlignDist = textAlignTop ? (distY - 5) : (this.plotHeight - distY + 5),
              divStyle = 'position:absolute;' + (textAlignTop ? 'top' : 'bottom') + ':' + yAlignDist + 'px;'; //@todo: change
          if (textAlignRight)
            divStyle += 'right:'+(this.canvasWidth - distX)+'px;text-align:right;';
          else 
            divStyle += 'left:'+distX+'px;text-align:left;';
          html.push('<div style="', divStyle, '" class="flotr-grid-label">', label, '</div>');
        }
        else {
          style.textAlign = textAlignRight ? 'right' : 'left';
          style.textBaseline = textAlignTop ? 'top' : 'bottom';
          Flotr.drawText(ctx, label, distX, distY, style);
        }
      }
    }, this);
    
    if (options.HtmlText || !this.textEnabled) {
      var div = Flotr.DOM.node('<div style="color:' + this.options.grid.color + '" class="flotr-labels"></div>');
      Flotr.DOM.insert(div, html.join(''));
      Flotr.DOM.insert(this.el, div);
    }
    
    ctx.restore();
    options.pie.drawn = true;
  },
  plotSlice: function(x, y, radius, startAngle, endAngle, fill, vScale) {
    var ctx = this.ctx;
    vScale = vScale || 1;

    ctx.scale(1, vScale);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc   (x, y, radius, startAngle, endAngle, fill);
    ctx.lineTo(x, y);
    ctx.closePath();
  },
  hit: function(mouse, n){

    var series = this.series,
      options = this.options,
      radius = (Math.min(this.canvasWidth, this.canvasHeight) * options.pie.sizeRatio) / 2,
      vScale = 1,//Math.cos(series.pie.viewAngle),
      angle = options.pie.startAngle,
      center, // Center of the pie
      s, x, y;

    center = {
      x: (this.plotWidth)/2,
      y: (this.plotHeight)/2
    };

    portions = this.pie._getPortions();
    slices = this.pie._getSlices(portions, series, angle);

    // Add a circle
    function circle (angle) {
      return angle > 0 ? angle: angle + (2 * Math.PI);
    }

    //
    for (i = 0; i < series.length; i++){

      s = series[i];
      x = s.data[0][0];
      y = s.data[0][1];

      if (y === null) continue;
      
      var a = (mouse.relX-center.x),
        b = (mouse.relY-center.y),
        c = Math.sqrt(Math.pow(a, 2)+Math.pow(b, 2)),
        sAngle = circle((slices[i].startAngle)%(2 * Math.PI)),
        eAngle = circle((slices[i].endAngle)%(2 * Math.PI)),
        xSin = b/c,
        kat = circle(Math.asin(xSin)%(2 * Math.PI)),
        kat2 = Math.asin(-xSin)+(Math.PI);

      //if (c<radius && (a>0 && sAngle < kat && eAngle > kat)) //I i IV quarter
      //if (c<radius && (a<0 && sAngle < kat2 && eAngle > kat2)) //II i III quarter
      //if(sAngle>aAngle && ((a>0 && (sAngle < kat || eAngle > kat)) || (a<0 && (sAngle < kat2 || eAngle > kat2)))) //if a slice is crossing 0 angle
      
      if (c<radius+10 && ((((a>0 && sAngle < kat && eAngle > kat)) || (a<0 && sAngle < kat2 && eAngle > kat2)) || 
          ( (sAngle>eAngle || slices[i].fraction==1) && ((a>0 && (sAngle < kat || eAngle > kat)) || (a<0 && (sAngle < kat2 || eAngle > kat2))))))
      { 
        n.x = x;
        n.y = y;
        n.sAngle = sAngle;
        n.eAngle = eAngle;
        n.mouse = s.mouse;
        n.series = s;
        n.allSeries = series;
        n.seriesIndex = i;
        n.fraction = slices[i].fraction;
      }
    }
  },
  drawHit: function(n){
    var octx = this.octx,
      s = n.series,
      xa = n.xaxis,
      ya = n.yaxis;

    octx.save();
    octx.translate(this.plotOffset.left, this.plotOffset.top);
    octx.beginPath();

    if (s.mouse.trackAll) {
      octx.moveTo(xa.d2p(n.x), ya.d2p(0));
      octx.lineTo(xa.d2p(n.x), ya.d2p(n.yaxis.max));
    }
    else {
      var center = {
        x: (this.plotWidth)/2,
        y: (this.plotHeight)/2
      },
      radius = (Math.min(this.canvasWidth, this.canvasHeight) * s.pie.sizeRatio) / 2,

      bisection = n.sAngle<n.eAngle ? (n.sAngle + n.eAngle) / 2 : (n.sAngle + n.eAngle + 2* Math.PI) / 2,
      xOffset = center.x + Math.cos(bisection) * n.series.pie.explode,
      yOffset = center.y + Math.sin(bisection) * n.series.pie.explode;
      
      octx.beginPath();
      octx.moveTo(xOffset, yOffset);
      if (n.fraction != 1)
        octx.arc(xOffset, yOffset, radius, n.sAngle, n.eAngle, false);
      else
        octx.arc(xOffset, yOffset, radius, n.sAngle, n.eAngle-0.00001, false);
      octx.lineTo(xOffset, yOffset);
      octx.closePath();
    }

    octx.stroke();
    octx.closePath();
    octx.restore();
  },
  clearHit: function(){
    var center = {
      x: this.plotOffset.left + (this.plotWidth)/2,
      y: this.plotOffset.top + (this.plotHeight)/2
    },
    pie = this.prevHit.series.pie,
    radius = (Math.min(this.canvasWidth, this.canvasHeight) * pie.sizeRatio) / 2,
    margin = (pie.explode + pie.lineWidth) * 4;
      
    this.octx.clearRect(
      center.x - radius - margin, 
      center.y - radius - margin, 
      2*(radius + margin), 
      2*(radius + margin)
    );
  },
  _getPortions: function(){
    return _.map(this.series, function(hash, index){
      if (hash.pie.show && hash.data[0][1] !== null)
        return {
          name: (hash.label || hash.data[0][1]),
          value: [index, hash.data[0][1]],
          options: hash.pie,
          series: hash
        };
    });
  },
  _getSum: function(portions){
    // Sum of the portions' angles
    return _.inject(_.pluck(_.pluck(portions, 'value'), 1), function(acc, n) { return acc + n; }, 0);
  },
  _getSlices: function(portions, series, startAngle){
    var sum = this.pie._getSum(portions),
      fraction = 0.0,
      angle = (!_.isUndefined(startAngle) ? startAngle : series.pie.startAngle),
      value = 0.0;
    return _.map(portions, function(slice){
      angle += fraction;
      value = parseFloat(slice.value[1]); // @warning : won't support null values !!
      fraction = value/sum;
      return {
        name:     slice.name,
        fraction: fraction,
        x:        slice.value[0],
        y:        value,
        value:    value,
        options:  slice.options,
        series:   slice.series,
        startAngle: 2 * angle * Math.PI,
        endAngle:   2 * (angle + fraction) * Math.PI
      };
    });
  }
});

/** Points **/
Flotr.addType('points', {
  options: {
    show: false,           // => setting to true will show points, false will hide
    radius: 3,             // => point radius (pixels)
    lineWidth: 2,          // => line width in pixels
    fill: true,            // => true to fill the points with a color, false for (transparent) no fill
    fillColor: '#FFFFFF',  // => fill color
    fillOpacity: 0.4       // => opacity of color inside the points
  },
  /**
   * Draws point series in the canvas element.
   * @param {Object} series - Series with options.points.show = true.
   */
  draw: function(series) {
    var ctx = this.ctx,
        lw = series.lines.lineWidth,
        sw = series.shadowSize;
    
    ctx.save();
    ctx.translate(this.plotOffset.left, this.plotOffset.top);
    
    if(sw > 0){
      ctx.lineWidth = sw / 2;
      
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      this.points.plotShadows(series, sw/2 + ctx.lineWidth/2, series.points.radius);

      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      this.points.plotShadows(series, ctx.lineWidth/2, series.points.radius);
    }

    ctx.lineWidth = series.points.lineWidth;
    ctx.strokeStyle = series.color;
    ctx.fillStyle = series.points.fillColor ? series.points.fillColor : series.color;
    this.points.plot(series, series.points.radius, series.points.fill);
    ctx.restore();
  },
  plot: function (series, radius, fill) {
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        data = series.data,
        i, x, y;
      
    for(i = data.length - 1; i > -1; --i){
      x = data[i][0];
      y = data[i][1];
      // To allow empty values
      if(y === null || x < xa.min || x > xa.max || y < ya.min || y > ya.max)
        continue;
      
      ctx.beginPath();
      ctx.arc(xa.d2p(x), ya.d2p(y), radius, 0, 2 * Math.PI, true);
      if(fill) ctx.fill();
      ctx.stroke();
      ctx.closePath();
    }
  },
  plotShadows: function(series, offset, radius){
    var xa = series.xaxis,
        ya = series.yaxis,
        ctx = this.ctx,
        data = series.data,
        i, x, y;
      
    for(i = data.length - 1; i > -1; --i){
      x = data[i][0];
      y = data[i][1];
      if (y === null || x < xa.min || x > xa.max || y < ya.min || y > ya.max)
        continue;
      ctx.beginPath();
      ctx.arc(xa.d2p(x), ya.d2p(y) + offset, radius, 0, Math.PI, false);
      ctx.stroke();
      ctx.closePath();
    }
  },
  getHit: function(series, pos) {
    var xdiff, ydiff, i, d, dist, x, y,
        o = series.points,
        data = series.data,
        sens = series.mouse.sensibility * (o.lineWidth + o.radius),
        hit = {
        index: null,
        series: series,
        distance: Number.MAX_VALUE,
        x: null,
        y: null,
        precision: 1
        };
    
    for (i = data.length-1; i > -1; --i) {
      d = data[i];
      x = series.xaxis.d2p(d[0]);
      y = series.yaxis.d2p(d[1]);
      xdiff = x - pos.relX;
      ydiff = y - pos.relY;
      dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
      
      if (dist < sens && dist < hit.distance) {
        hit = {
          index: i,
          series: series,
          distance: dist,
          data: d,
          x: x,
          y: y,
          precision: 1
        };
      }
    }
    
    return hit;
  },
  drawHit: function(series, index) {
    
  },
  clearHit: function(series, index) {
    
  }
});

/** Radar **/
Flotr.addType('radar', {
  options: {
    show: false,           // => setting to true will show radar chart, false will hide
    lineWidth: 2,          // => line width in pixels
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillOpacity: 0.4,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    radiusRatio: 0.90      // => ratio of the radar, against the plot size
  },
  draw: function(series){
    var ctx = this.ctx,
        options = this.options;
    
    ctx.save();
    ctx.translate(this.plotOffset.left+this.plotWidth/2, this.plotOffset.top+this.plotHeight/2);
    ctx.lineWidth = series.radar.lineWidth;
    
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    this.radar.plot(series, series.shadowSize / 2);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    this.radar.plot(series, series.shadowSize / 4);
    
    ctx.strokeStyle = series.color;
    ctx.fillStyle = this.processColor(series.color, {opacity: series.radar.fillOpacity});
    this.radar.plot(series);
    
    ctx.restore();
  },
  plot: function(series, offset){
    var ctx = this.ctx,
        options = this.options,
        data = series.data,
        radius = Math.min(this.plotHeight, this.plotWidth)*options.radar.radiusRatio/2,
        coeff = 2*(Math.PI/data.length),
        angle = -Math.PI/2;
        
    offset = offset || 0;
    
    ctx.beginPath();
    for(var i = 0; i < data.length; ++i){
      var x = data[i][0],
          y = data[i][1],
          ratio = y / this.axes.y.max;

      ctx[i == 0 ? 'moveTo' : 'lineTo'](Math.cos(i*coeff+angle)*radius*ratio + offset, Math.sin(i*coeff+angle)*radius*ratio + offset);
    }
    ctx.closePath();
    if (series.radar.fill) ctx.fill();
    ctx.stroke();
  }
});

(function () {

var D = Flotr.DOM;

Flotr.addPlugin('legend', {
  options: {
    show: true,            // => setting to true will show the legend, hide otherwise
    noColumns: 1,          // => number of colums in legend table // @todo: doesn't work for HtmlText = false
    labelFormatter: function(v){return v;}, // => fn: string -> string
    labelBoxBorderColor: '#CCCCCC', // => border color for the little label boxes
    labelBoxWidth: 14,
    labelBoxHeight: 10,
    labelBoxMargin: 5,
    labelBoxOpacity: 0.4,
    container: null,       // => container (as jQuery object) to put legend in, null means default on top of graph
    position: 'nw',        // => position of default legend container within plot
    margin: 5,             // => distance from grid edge to default legend container within plot
    backgroundColor: null, // => null means auto-detect
    backgroundOpacity: 0.85// => set to 0 to avoid background, set to 1 for a solid background
  },
  callbacks: {
    'flotr:afterinit': function() {
      this.legend.insertLegend();
    }
  },
  /**
   * Adds a legend div to the canvas container or draws it on the canvas.
   */
  insertLegend: function(){

    if(!this.options.legend.show)
      return;

    var series = this.series,
      plotOffset = this.plotOffset,
      options = this.options,
      legend = options.legend,
      fragments = [],
      rowStarted = false, 
      ctx = this.ctx,
      noLegendItems = _.filter(series, function(s) {return (s.label && !s.hide);}).length,
      p = legend.position, 
      m = legend.margin,
      i, label, color;

    if (noLegendItems) {
      if (!options.HtmlText && this.textEnabled && !legend.container) {
        var style = {
          size: options.fontSize*1.1,
          color: options.grid.color
        };

        var lbw = legend.labelBoxWidth,
            lbh = legend.labelBoxHeight,
            lbm = legend.labelBoxMargin,
            offsetX = plotOffset.left + m,
            offsetY = plotOffset.top + m;
        
        // We calculate the labels' max width
        var labelMaxWidth = 0;
        for(i = series.length - 1; i > -1; --i){
          if(!series[i].label || series[i].hide) continue;
          label = legend.labelFormatter(series[i].label);
          labelMaxWidth = Math.max(labelMaxWidth, Flotr.measureText(ctx, label, style).width);
        }
        
        var legendWidth  = Math.round(lbw + lbm*3 + labelMaxWidth),
            legendHeight = Math.round(noLegendItems*(lbm+lbh) + lbm);
        
        if(p.charAt(0) == 's') offsetY = plotOffset.top + this.plotHeight - (m + legendHeight);
        if(p.charAt(1) == 'e') offsetX = plotOffset.left + this.plotWidth - (m + legendWidth);
        
        // Legend box
        color = this.processColor(legend.backgroundColor || 'rgb(240,240,240)', {opacity: legend.backgroundOpacity || 0.1});
        
        ctx.fillStyle = color;
        ctx.fillRect(offsetX, offsetY, legendWidth, legendHeight);
        ctx.strokeStyle = legend.labelBoxBorderColor;
        ctx.strokeRect(Flotr.toPixel(offsetX), Flotr.toPixel(offsetY), legendWidth, legendHeight);
        
        // Legend labels
        var x = offsetX + lbm;
        var y = offsetY + lbm;
        for(i = 0; i < series.length; i++){
          if(!series[i].label || series[i].hide) continue;
          label = legend.labelFormatter(series[i].label);
          
          ctx.fillStyle = series[i].color;
          ctx.fillRect(x, y, lbw-1, lbh-1);
          
          ctx.strokeStyle = legend.labelBoxBorderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.ceil(x)-1.5, Math.ceil(y)-1.5, lbw+2, lbh+2);
          
          // Legend text
          Flotr.drawText(ctx, label, x + lbw + lbm, y + (lbh + style.size - ctx.fontDescent(style))/2, style);
          
          y += lbh + lbm;
        }
      }
      else {
        for(i = 0; i < series.length; ++i){
          if(!series[i].label || series[i].hide) continue;
          
          if(i % legend.noColumns === 0){
            fragments.push(rowStarted ? '</tr><tr>' : '<tr>');
            rowStarted = true;
          }
           
          // @TODO remove requirement on bars
          var s = series[i],
            boxWidth = legend.labelBoxWidth,
            boxHeight = legend.labelBoxHeight,
            opacityValue = (s.bars ? s.bars.fillOpacity : legend.labelBoxOpacity),
            opacity = 'opacity:' + opacityValue + ';filter:alpha(opacity=' + opacityValue*100 + ');';

          label = legend.labelFormatter(s.label);
          color = 'background-color:' + ((s.bars && s.bars.show && s.bars.fillColor && s.bars.fill) ? s.bars.fillColor : s.color) + ';';
          
          fragments.push(
            '<td class="flotr-legend-color-box">',
              '<div style="border:1px solid ', legend.labelBoxBorderColor, ';padding:1px">',
                '<div style="width:', (boxWidth-1), 'px;height:', (boxHeight-1), 'px;border:1px solid ', series[i].color, '">', // Border
                  '<div style="width:', boxWidth, 'px;height:', boxHeight, 'px;', 'opacity:.4;', color, '"></div>', // Background
                '</div>',
              '</div>',
            '</td>',
            '<td class="flotr-legend-label">', label, '</td>'
          );
        }
        if(rowStarted) fragments.push('</tr>');
          
        if(fragments.length > 0){
          var table = '<table style="font-size:smaller;color:' + options.grid.color + '">' + fragments.join('') + '</table>';
          if(legend.container){
            D.insert(legend.container, table);
          }
          else {
            var styles = {position: 'absolute', 'z-index': 2};
            
                 if(p.charAt(0) == 'n') { styles.top = (m + plotOffset.top) + 'px'; styles.bottom = 'auto'; }
            else if(p.charAt(0) == 's') { styles.bottom = (m + plotOffset.bottom) + 'px'; styles.top = 'auto'; }
                 if(p.charAt(1) == 'e') { styles.right = (m + plotOffset.right) + 'px'; styles.left = 'auto'; }
            else if(p.charAt(1) == 'w') { styles.left = (m + plotOffset.left) + 'px'; styles.right = 'auto'; }
                 
            var div = D.create('div'), size;
            div.className = 'flotr-legend';
            D.setStyles(div, styles);
            D.insert(div, table);
            D.insert(this.el, div);
            
            if(legend.backgroundOpacity !== 0.0)
              return;
            /**
             * Put in the transparent background separately to avoid blended labels and
             * label boxes.
             */
            var c = legend.backgroundColor;
            if(!c){
              var tmp = (options.grid.backgroundColor) ? options.grid.backgroundColor : Flotr.Color.extract(div);
              c = this.processColor(tmp, null, {opacity: 1});
            }
            c = '#ff00ff';

            _.extend(styles, D.size(div), {
              'backgroundColor': c,
              'z-index': 1
            });
            styles.width += 'px';
            styles.height += 'px';

            div = D.create('div');
            div.className = 'flotr-legend-bg';
            D.setStyles(div, styles);
            D.opacity(div, legend.backgroundOpacity);
            D.insert(div, ' ');
            D.insert(this.el, div);
          }
        }
      }
    }
  }
});
})();

/** Spreadsheet **/
(function() {

  var D = Flotr.DOM;

Flotr.addPlugin('spreadsheet', {
  options: {
    show: false,           // => show the data grid using two tabs
    tabGraphLabel: 'Graph',
    tabDataLabel: 'Data',
    toolbarDownload: 'Download CSV', // @todo: add better language support
    toolbarSelectAll: 'Select all',
    csvFileSeparator: ',',
    decimalSeparator: '.',
    tickFormatter: null
  },
  /**
   * Builds the tabs in the DOM
   */
  callbacks: {
    'flotr:afterconstruct': function(){
      // @TODO necessary?
      //this.el.select('.flotr-tabs-group,.flotr-datagrid-container').invoke('remove');
      
      if (!this.options.spreadsheet.show) return;
      
      var ss = this.spreadsheet,
        container = D.node('<div class="flotr-tabs-group" style="position:absolute;left:0px;width:'+this.canvasWidth+'px"></div>'),
        graph = D.node('<div style="float:left" class="flotr-tab selected">'+this.options.spreadsheet.tabGraphLabel+'</div>'),
        data = D.node('<div style="float:left" class="flotr-tab">'+this.options.spreadsheet.tabDataLabel+'</div>'),
        offset;

      ss.tabsContainer = container;
      ss.tabs = { graph : graph, data : data };

      D.insert(container, graph);
      D.insert(container, data);
      D.insert(this.el, container);

      offset = D.size(data).height + 2;
      this.plotOffset.bottom += offset;

      D.setStyles(container, {top: this.canvasHeight-offset+'px'});

      Flotr.EventAdapter.
        observe(graph, 'click',  function(){ss.showTab('graph');}).
        observe(data, 'click', function(){ss.showTab('data');});

      return;
    }
  },
  /**
   * Builds a matrix of the data to make the correspondance between the x values and the y values :
   * X value => Y values from the axes
   * @return {Array} The data grid
   */
  loadDataGrid: function(){
    if (this.seriesData) return this.seriesData;

    var s = this.series,
        dg = [];

    /* The data grid is a 2 dimensions array. There is a row for each X value.
     * Each row contains the x value and the corresponding y value for each serie ('undefined' if there isn't one)
    **/
    for(i = 0; i < s.length; ++i){
      _.each(s[i].data, function(v) {
        var x = v[0],
            y = v[1], 
            r = _.detect(dg, function(row) {return row[0] == x;});
        if (r) {
          r[i+1] = y;
        } else {
          var newRow = [];
          newRow[0] = x;
          newRow[i+1] = y;
          dg.push(newRow);
        }
      });
    }
    
    // The data grid is sorted by x value
    this.seriesData = _.sortBy(dg, function(v){return v[0]});
    return this.seriesData;
  },
  /**
   * Constructs the data table for the spreadsheet
   * @todo make a spreadsheet manager (Flotr.Spreadsheet)
   * @return {Element} The resulting table element
   */
  constructDataGrid: function(){
    // If the data grid has already been built, nothing to do here
    if (this.spreadsheet.datagrid) return this.spreadsheet.datagrid;
    
    var i, j, 
        s = this.series,
        datagrid = this.spreadsheet.loadDataGrid(),
        colgroup = ['<colgroup><col />'],
        buttonDownload, buttonSelect, t;
    
    // First row : series' labels
    var html = ['<table class="flotr-datagrid"><tr class="first-row">'];
    html.push('<th>&nbsp;</th>');
    for (i = 0; i < s.length; ++i) {
      html.push('<th scope="col">'+(s[i].label || String.fromCharCode(65+i))+'</th>');
      colgroup.push('<col />');
    }
    html.push('</tr>');
    
    // Data rows
    for (j = 0; j < datagrid.length; ++j) {
      html.push('<tr>');
      for (i = 0; i < s.length+1; ++i) {
        var tag = 'td',
            content = (datagrid[j][i] != null ? Math.round(datagrid[j][i]*100000)/100000 : '');
        
        if (i == 0) {
          tag = 'th';
          var label;
          if(this.options.xaxis.ticks) {
            var tick = this.options.xaxis.ticks.find(function (x) { return x[0] == datagrid[j][i] });
            if (tick) label = tick[1];
          } 
          else if (this.options.spreadsheet.tickFormatter){
            label = this.options.spreadsheet.tickFormatter(content);
          }
          else {
            label = this.options.xaxis.tickFormatter(content);
          }
          
          if (label) content = label;
        }

        html.push('<'+tag+(tag=='th'?' scope="row"':'')+'>'+content+'</'+tag+'>');
      }
      html.push('</tr>');
    }
    colgroup.push('</colgroup>');
    t = D.node(html.join(''));

    /**
     * @TODO disabled this
    if (!Flotr.isIE || Flotr.isIE == 9) {
      function handleMouseout(){
        t.select('colgroup col.hover, th.hover').invoke('removeClassName', 'hover');
      }
      function handleMouseover(e){
        var td = e.element(),
          siblings = td.previousSiblings();
        t.select('th[scope=col]')[siblings.length-1].addClassName('hover');
        t.select('colgroup col')[siblings.length].addClassName('hover');
      }
      _.each(t.select('td'), function(td) {
        Flotr.EventAdapter.
          observe(td, 'mouseover', handleMouseover).
          observe(td, 'mouseout', handleMouseout);
      });
    }
    */

    buttonDownload = D.node(
      '<button type="button" class="flotr-datagrid-toolbar-button">' +
      this.options.spreadsheet.toolbarDownload +
      '</button>');

    buttonSelect = D.node(
      '<button type="button" class="flotr-datagrid-toolbar-button">' +
      this.options.spreadsheet.toolbarSelectAll+
      '</button>');

    Flotr.EventAdapter.
      observe(buttonDownload, 'click', _.bind(this.spreadsheet.downloadCSV, this)).
      observe(buttonSelect, 'click', _.bind(this.spreadsheet.selectAllData, this));

    var toolbar = D.node('<div class="flotr-datagrid-toolbar"></div>');
    D.insert(toolbar, buttonDownload);
    D.insert(toolbar, buttonSelect);

    var containerHeight =this.canvasHeight - D.size(this.spreadsheet.tabsContainer).height-2,
        container = D.node('<div class="flotr-datagrid-container" style="position:absolute;left:0px;top:0px;width:'+
          this.canvasWidth+'px;height:'+containerHeight+'px;overflow:auto;z-index:10"></div>');

    D.insert(container, toolbar);
    D.insert(container, t);
    D.insert(this.el, container);
    this.spreadsheet.datagrid = t;
    this.spreadsheet.container = container;

    return t;
  },  
  /**
   * Shows the specified tab, by its name
   * @todo make a tab manager (Flotr.Tabs)
   * @param {String} tabName - The tab name
   */
  showTab: function(tabName){
    var selector = 'canvas, .flotr-labels, .flotr-legend, .flotr-legend-bg, .flotr-title, .flotr-subtitle';
    switch(tabName) {
      case 'graph':
        D.hide(this.spreadsheet.container);
        D.removeClass(this.spreadsheet.tabs.data, 'selected');
        D.addClass(this.spreadsheet.tabs.graph, 'selected');
      break;
      case 'data':
        if (!this.spreadsheet.datagrid)
          this.spreadsheet.constructDataGrid();
        D.show(this.spreadsheet.container);
        D.addClass(this.spreadsheet.tabs.data, 'selected');
        D.removeClass(this.spreadsheet.tabs.graph, 'selected');
      break;
    }
  },
  /**
   * Selects the data table in the DOM for copy/paste
   */
  selectAllData: function(){
    console.log('selectAllData');
    if (this.spreadsheet.tabs) {
      var selection, range, doc, win, node = this.spreadsheet.constructDataGrid();

      this.spreadsheet.showTab('data');
      
      // deferred to be able to select the table
      setTimeout(function () {
        if ((doc = node.ownerDocument) && (win = doc.defaultView) && 
            win.getSelection && doc.createRange && 
            (selection = window.getSelection()) && 
            selection.removeAllRanges) {
            range = doc.createRange();
            range.selectNode(node);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        else if (document.body && document.body.createTextRange && 
                (range = document.body.createTextRange())) {
            range.moveToElementText(node);
            range.select();
        }
      }, 0);
      return true;
    }
    else return false;
  },
  /**
   * Converts the data into CSV in order to download a file
   */
  downloadCSV: function(){
    console.log('downloadCSV');
    var i, csv = '',
        series = this.series,
        options = this.options,
        dg = this.spreadsheet.loadDataGrid(),
        separator = encodeURIComponent(options.spreadsheet.csvFileSeparator);
    
    if (options.spreadsheet.decimalSeparator === options.spreadsheet.csvFileSeparator) {
      throw "The decimal separator is the same as the column separator ("+options.spreadsheet.decimalSeparator+")";
    }
    
    // The first row
    for (i = 0; i < series.length; ++i) {
      csv += separator+'"'+(series[i].label || String.fromCharCode(65+i)).replace(/\"/g, '\\"')+'"';
    }
    csv += "%0D%0A"; // \r\n
    
    // For each row
    for (i = 0; i < dg.length; ++i) {
      var rowLabel = '';
      // The first column
      if (options.xaxis.ticks) {
        var tick = options.xaxis.ticks.find(function(x){return x[0] == dg[i][0]});
        if (tick) rowLabel = tick[1];
      }
      else if (options.spreadsheet.tickFormatter){
        rowLabel = options.spreadsheet.tickFormatter(dg[i][0]);
      }
      else {
        rowLabel = options.xaxis.tickFormatter(dg[i][0]);
      }
      rowLabel = '"'+(rowLabel+'').replace(/\"/g, '\\"')+'"';
      var numbers = dg[i].slice(1).join(separator);
      if (options.spreadsheet.decimalSeparator !== '.') {
        numbers = numbers.replace(/\./g, options.spreadsheet.decimalSeparator);
      }
      csv += rowLabel+separator+numbers+"%0D%0A"; // \t and \r\n
    }
    if (Flotr.isIE && Flotr.isIE < 9) {
      csv = csv.replace(new RegExp(separator, 'g'), decodeURIComponent(separator)).replace(/%0A/g, '\n').replace(/%0D/g, '\r');
      window.open().document.write(csv);
    }
    else window.open('data:text/csv,'+csv);
  }
});
})();
