(function () {

var D = Flotr.DOM;

Flotr.addPlugin('statusGraphTitle', {
  callbacks: {
    'flotr:afterdraw': function() {
      this.statusGraphTitle.drawStatusTitle();
    }
  },
  /**
   * Draws the title
   */
  drawStatusTitle : function () {
    var 
        options = this.options,
        margin = options.grid.labelMargin,
        ctx = this.ctx,
        a = this.axes;
	
    var style = {
      size: options.statusGraphTitle.fontSize,
      color: options.statusGraphTitle.color,
      textAlign: 'center',
	  weight: 1.5,
	  textBaseline: 'middle'
    };
	
	// Draw text
	if (options.statusGraphTitle.text) {
	    Flotr.drawText(
			ctx, options.statusGraphTitle.text,
			this.plotOffset.left + this.plotWidth/2,
			this.plotHeight/2,
			style
		);
	}
}
});
})();