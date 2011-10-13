(function() {

var
  D = Flotr.DOM,
  _ = Flotr._;

Flotr.addPlugin('download', {

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
      this.download.restoreCanvas();
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
    if (this.saveImageElement) this.el.removeChild(this.saveImageElement);
    this.saveImageElement = null;
  }
});

})();
