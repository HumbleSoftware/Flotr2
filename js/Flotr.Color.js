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
}

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
    var name = (color+'').strip().toLowerCase();
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
