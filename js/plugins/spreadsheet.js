/** Spreadsheet **/
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
      this.el.select('.flotr-tabs-group,.flotr-datagrid-container').invoke('remove');
      
      if (!this.options.spreadsheet.show) return;
      
      var ss = this.spreadsheet;
      ss.tabsContainer = new Element('div', {style:'position:absolute;left:0px;width:'+this.canvasWidth+'px'}).addClassName('flotr-tabs-group');
      ss.tabs = {
        graph: new Element('div', {style:'float:left'}).addClassName('flotr-tab selected').update(this.options.spreadsheet.tabGraphLabel),
        data: new Element('div', {style:'float:left'}).addClassName('flotr-tab').update(this.options.spreadsheet.tabDataLabel)
      };
      ss.tabsContainer.insert(ss.tabs.graph).insert(ss.tabs.data);
      
      this.el.insert({bottom: ss.tabsContainer});
      
      var offset = ss.tabs.data.getHeight() + 2;
      this.plotOffset.bottom += offset;
      ss.tabsContainer.setStyle({top: this.canvasHeight-offset+'px'});
      
      Flotr.EventAdapter.
        observe(ss.tabs.graph, 'click',  function(){ss.showTab('graph')}).
        observe(ss.tabs.data, 'click', function(){ss.showTab('data')});
    }
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
        datagrid = this.loadDataGrid(),
        t = this.spreadsheet.datagrid = new Element('table').addClassName('flotr-datagrid'),
        colgroup = ['<colgroup><col />'],
        buttonDownload, buttonSelect;
    
    // First row : series' labels
    var html = ['<tr class="first-row">'];
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
    t.update(colgroup.join('')+html.join(''));
    
    if (!Prototype.Browser.IE || Flotr.isIE9) {
      function handleMouseout(){
        t.select('colgroup col.hover, th.hover').invoke('removeClassName', 'hover');
      }
      function handleMouseover(e){
        var td = e.element(),
          siblings = td.previousSiblings();
        t.select('th[scope=col]')[siblings.length-1].addClassName('hover');
        t.select('colgroup col')[siblings.length].addClassName('hover');
      }
      t.select('td').each(function(td) {
        Flotr.EventAdapter.
          observe(td, 'mouseover', handleMouseover).
          observe(td, 'mouseout', handleMouseout);
      });
    }

    buttonDownload = new Element('button', {type:'button'})
      .addClassName('flotr-datagrid-toolbar-button')
      .update(this.options.spreadsheet.toolbarDownload);
    buttonSelect = new Element('button', {type:'button'})
      .addClassName('flotr-datagrid-toolbar-button')
      .update(this.options.spreadsheet.toolbarSelectAll);

    Flotr.EventAdapter.
      observe(buttonDownload, 'click', _.bind(this.spreadsheet.downloadCSV, this)).
      observe(buttonSelect, 'click', _.bind(this.spreadsheet.selectAllData, this));

    var toolbar = new Element('div').addClassName('flotr-datagrid-toolbar').
      insert(buttonDownload).insert(buttonSelect);
    
    var container = new Element('div', {
      style: 'left:0px;top:0px;width:'+this.canvasWidth+'px;height:'+
             (this.canvasHeight-this.spreadsheet.tabsContainer.getHeight()-2)+'px;overflow:auto;'
    }).addClassName('flotr-datagrid-container');
    
    container.insert(toolbar);
    t.wrap(container.hide());
    
    this.el.insert(container);
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
        if (this.spreadsheet.datagrid)
          this.spreadsheet.datagrid.up().hide();
        this.el.select(selector).invoke('show');
        this.spreadsheet.tabs.data.removeClassName('selected');
        this.spreadsheet.tabs.graph.addClassName('selected');
      break;
      case 'data':
        this.spreadsheet.constructDataGrid();
        this.spreadsheet.datagrid.up().show();
        this.el.select(selector).invoke('hide');
        this.spreadsheet.tabs.data.addClassName('selected');
        this.spreadsheet.tabs.graph.removeClassName('selected');
      break;
    }
  },
  /**
   * Selects the data table in the DOM for copy/paste
   */
  selectAllData: function(){
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
    var i, csv = '',
        series = this.series,
        options = this.options,
        dg = this.loadDataGrid(),
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
    if (Prototype.Browser.IE && !Flotr.isIE9) {
      csv = csv.replace(new RegExp(separator, 'g'), decodeURIComponent(separator)).replace(/%0A/g, '\n').replace(/%0D/g, '\r');
      window.open().document.write(csv);
    }
    else window.open('data:text/csv,'+csv);
  }
});

