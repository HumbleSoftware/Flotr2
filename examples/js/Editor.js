(function () {

  var
    ONERROR   = window.onerror,
    COUNT     = 0,
    TYPES     = {},

    T_CONTROLS =
      '<div class="controls">' +
        '<button class="fiddle btn large primary">Fiddle</button>' +
        '<button class="run btn large primary">Run</button>' +
      '</div>',
    T_EDITOR = '<div class="editor"></div>',
    T_SOURCE = '<div class="source"></div>',
    T_ERRORS = '<div class="errors"></div>',
    T_RENDER = '<div class="render"></div>',
    T_IFRAME = '<iframe></iframe>';


  // Javascript type:
  TYPES.javascript = function Javascript (o) {
    this.onerror = o.onerror;
  };
  TYPES.javascript.prototype = {
    codeMirrorType : 'javascript',
    example : function (o) {

      var
        example = o.example,
        render = o.render,
        renderId = $(render).attr('id'),
        args = o.args ? ',' + o.args.toString() : '';

      return '(' + example + ')(document.getElementById("' + renderId+ '")' +
          args + ');';
    },
    render : function (o) {
      eval(o.example);
    }
  };

  // HTML Type:
  TYPES.html = function Html (o) {
    this.onerror = o.onerror;
  };
  TYPES.html.prototype = {
    codeMirrorType : 'htmlmixed',
    example : function (o) {
      return $.trim(o.example);
    },
    render : function (o) {

      var
        example = o.example,
        render = o.render,
        iframe = $(T_IFRAME),
        that = this,
        win, doc;

      render.html(iframe);

      win = iframe[0].contentWindow;

      doc = win.document;
      doc.open();

      // Error
      win.onerror = iframe.onerror = function () {
        that.onerror.apply(null, arguments);
      }

      doc.write(example);
      doc.close();
    }
  };

  // Editor
  function Editor (container, o) {

    var
      type      = o.type || 'javascript',
      example   = o.example || '',
      noRun     = o.noRun || false,
      teardown  = o.teardown || false,
      controls  = $(T_CONTROLS),
      render    = $(T_RENDER),
      errors    = $(T_ERRORS),
      source    = $(T_SOURCE),
      node      = $(T_EDITOR),
      renderId  = 'editor-render-' + COUNT,
      api,
      render,
      codeMirror;

    api = new TYPES[type]({
      onerror : onerror
    });
    if (!api) throw 'Invalid type: API not found for type `' + type + '`.';

    render
      .attr('id', renderId);

    errors
      .hide();

    node
      .append(render)
      .append(controls)
      .append(source)
      .addClass(type)
      .addClass(noRun ? 'no-run' : '');

    container = $(container);
    container
      .append(node);

    source
      .append(errors)

    example = api.example({
      args : o.args,
      example : example,
      render : render
    });

    codeMirror = CodeMirror(source[0], {
      value : example,
      readOnly : noRun,
      lineNumbers : true,
      mode : api.codeMirrorType
    });

    if (!noRun) {
      controls.delegate('.run', 'click', function () {
        example = codeMirror.getValue();
        execute();
      });

      execute();
    }

    controls.delegate('.fiddle', 'click', function () {
      fiddle();
    });

    // Error handling:
    window.onerror = function (message, url, line) {

      onerror(message, url, line);
      console.log(message);

      if (ONERROR && $.isFunction(ONERROR)) {
        return ONERROR(message, url, line);
      } else {
        return false;
      }
    }

    // Helpers

    function execute () {
      errors.hide();
      if (teardown) {
        teardown.call();
      }
      api.render({
        example : example,
        render : render
      });
    }

    function onerror (message, url, line) {
      // @TODO Find some js error normalizing lib

      var
        doThatSexyThang = false,
        html = '<span class="error">Error: </span>',
        error, stack;

      /*
      // Native error type handling:
      if (typeof (message) !== 'string') {
        error = message;
        message = error.message;
        stack = error.stack;

        //if (stack) {
          console.log(stack);
        //}

        //console.log(message);

      }

      */

      html += '<span class="message">' + message + '</span>';
      if (typeof (line) !== "undefined") {
        html += '<span class="position">';
        html += 'Line <span class="line">' + line + '</span>';
        console.log(url);
        if (url) {
          html += ' of ';
          if (url == window.location) {
            html += '<span class="url">script</span>';
            if (doThatSexyThang) {
              //codeMirror.setMarker(line, '&#8226;');
            }
          } else {
            html += '<span class="url">' + url + '</span>';
          }
        }
        html += '.</span>';
      }

      errors.show();
      errors.html(html);
    }

    function fiddle () {
      var
        url = 'http://jsfiddle.net/api/post/jquery/1.7/',
        form = $('<form method="post" action="' + url + '" target="_blank"></form>'),
        input;

      // Resources
      resources = [
        'https://raw.github.com/HumbleSoftware/Flotr2/master/flotr2.min.js',
        'https://raw.github.com/HumbleSoftware/Flotr2/master/examples/examples.css'
      ];
      input = $('<input type="hidden" name="resources">')
        .attr('value', resources.join(','));
      form.append(input);

      // HTML
      input = $('<input type="hidden" name="html">')
        .attr('value', '<div id="'+renderId+'"></div>');
      form.append(input);

      // CSS
      input = $('<input type="hidden" name="normalize_css" value="no">')
      form.append(input);
      input = $('<input type="hidden" name="css">')
        .attr('value',
          '#'+renderId+' {\n  width: 340px;\n  height: 220px;' +
          '\n  margin: 24px auto;\n}'
        );
      form.append(input);

      // JS
      input = $('<input type="hidden" name="js">')
        .attr('value', '$(function () {\n' + example + '\n});');

      form.append(input);

      // Submit
      form.append(input);
      $(document.body).append(form);
      form.submit();
    }

    COUNT++;

    this.setExample = function (source, args) {
      example = api.example({
        args : args,
        example : source,
        render : render
      });
      codeMirror.setValue(example);
      codeMirror.refresh();
      execute();
    }
  }

  if (typeof Flotr.Examples === 'undefined') Flotr.Examples = {};
  Flotr.Examples.Editor = Editor;
})();
