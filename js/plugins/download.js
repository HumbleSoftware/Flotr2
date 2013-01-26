(function() {

var
  D = Flotr.DOM,
  _ = Flotr._;

function getImage (type, canvas, context, width, height, background) {

  // TODO add scaling for w / h
  var
    mime = 'image/'+type,
    data = context.getImageData(0, 0, width, height),
    image = new Image();

  context.save();
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  image.src = canvas.toDataURL(mime);
  context.restore();

  context.clearRect(0, 0, width, height);
  context.putImageData(data, 0, 0);

  return image;
}

Flotr.addPlugin('download', {

  saveImage: function (type, width, height, replaceCanvas) {
    var
      grid = this.options.grid,
      image;

    if (Flotr.isIE && Flotr.isIE < 9) {
      image = '<html><body>'+this.canvas.firstChild.innerHTML+'</body></html>';
      return window.open().document.write(image);
    }

    if (type !== 'jpeg' && type !== 'png') return;

    image = getImage(
      type, this.canvas, this.ctx,
      this.canvasWidth, this.canvasHeight,
      grid && grid.backgroundColor || '#ffffff'
    );

    if (_.isElement(image) && replaceCanvas) {
      this.download.restoreCanvas();
      D.hide(this.canvas);
      D.hide(this.overlay);
      D.setStyles({position: 'absolute'});
      D.insert(this.el, image);
      this.saveImageElement = image;
    } else {
      return window.open(image.src);
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
