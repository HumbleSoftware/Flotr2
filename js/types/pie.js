/**
 * Pie
 *
 * Formats the pies labels.
 * @param {Object} slice - Slice object
 * @return {String} Formatted pie label string
 */
(function () {

var
  _ = Flotr._;

Flotr.defaultPieLabelFormatter = function (total, value) {
  return (100 * value / total).toFixed(2)+'%';
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
    pie3DspliceThickness: 20,
    epsilon: 0.1,          // => how close do you have to get to hit empty slice
    verticalShift: 0,      // => how far to shift the center of the pie, up or down, in px, or in percent
    horizontalShift: 0     // => how far to shift the center of the pie, left or right, in px, or in percent
  },

  draw : function (options) {

    // TODO 3D charts what?
    var
      data            = options.data,
      context         = options.context,
      lineWidth       = options.lineWidth,
      shadowSize      = options.shadowSize,
      sizeRatio       = options.sizeRatio,
      height          = options.height,
      width           = options.width,
      verticalShift   = this.parseShift(options.verticalShift, height),
      horizontalShift = this.parseShift(options.horizontalShift, width),
      explode         = options.explode,
      color           = options.color,
      fill            = options.fill,
      fillStyle       = options.fillStyle,
      radius          = this.calculateRadius(width, height, sizeRatio,
                                            horizontalShift, verticalShift),
      value           = data[0][1],
      html            = [],
      vScale          = 1,//Math.cos(series.pie.viewAngle);
      measure         = Math.PI * 2 * value / this.total,
      startAngle      = this.startAngle || (2 * Math.PI * options.startAngle), // TODO: this initial startAngle is already in radians (fixing will be test-unstable)
      endAngle        = startAngle + measure,
      bisection       = startAngle + measure / 2,
      label           = options.labelFormatter(this.total, value),
      //plotTickness  = Math.sin(series.pie.viewAngle)*series.pie.spliceThickness / vScale;
      explodeCoeff    = explode + radius + 4,
      distX           = Math.cos(bisection) * explodeCoeff,
      distY           = Math.sin(bisection) * explodeCoeff,
      textAlign       = distX < 0 ? 'right' : 'left',
      textBaseline    = distY > 0 ? 'top' : 'bottom',
      style,
      x, y;
    
    context.save();
    context.translate((width / 2) + horizontalShift, (height / 2) + verticalShift);
    context.scale(1, vScale);

    x = Math.cos(bisection) * explode;
    y = Math.sin(bisection) * explode;

    // Shadows
    if (shadowSize > 0) {
      this.plotSlice(x + shadowSize, y + shadowSize, radius, startAngle, endAngle, context);
      if (fill) {
        context.fillStyle = 'rgba(0,0,0,0.1)';
        context.fill();
      }
    }

    this.plotSlice(x, y, radius, startAngle, endAngle, context);
    if (fill) {
      context.fillStyle = fillStyle;
      context.fill();
    }
    context.lineWidth = lineWidth;
    context.strokeStyle = color;
    context.stroke();

    style = {
      size : options.fontSize * 1.2,
      color : options.fontColor,
      weight : 1.5
    };

    if (label) {
      if (options.htmlText || !options.textEnabled) {
        divStyle = 'position:absolute;' + textBaseline + ':' + ((height / 2) + verticalShift + (textBaseline === 'top' ? distY : -distY)) + 'px;';
        divStyle += textAlign + ':' + ((width / 2) + horizontalShift + (textAlign === 'right' ? -distX : distX)) + 'px;';
        html.push('<div style="', divStyle, '" class="flotr-grid-label">', label, '</div>');
      }
      else {
        style.textAlign = textAlign;
        style.textBaseline = textBaseline;
        Flotr.drawText(context, label, distX, distY, style);
      }
    }
    
    if (options.htmlText || !options.textEnabled) {
      var div = Flotr.DOM.node('<div style="color:' + options.fontColor + '" class="flotr-labels"></div>');
      Flotr.DOM.insert(div, html.join(''));
      Flotr.DOM.insert(options.element, div);
    }
    
    context.restore();

    // New start angle
    this.startAngle = endAngle;
    this.slices = this.slices || [];
    this.slices.push({
      radius : radius,
      x : x,
      y : y,
      explode : explode,
      start : startAngle,
      end : endAngle
    });
  },

  parseShift: function (shift, size) {
    // if shift is number, use that (px), else if ends in %, calculate as % of size
    if (typeof shift === 'number') {
      // if shift is a number, just use that
      return shift;
    } else {
      // otherwise, make sure we have a string
      shift = shift.toString().trim();
      if (shift.slice(-1) === '%') {
        // if the string is like 12.3%, calculate the size
        return +(shift.slice(0, -1).trim()) / 100.0 * size ;
      } else if (shift.slice(-2) === 'px') {
        // if the shift is like 12.3px, extract the value
        return +(shift.slice(0, -2).trim());
      } else {
        // otherwise, attempt to just cast to a number
        return +shift;
      }
    }
  },

  calculateRadius: function (width, height, sizeRatio, horizontalShift, verticalShift) {
    // Calculate maximum radii that won't extend beyond
    // the borders defined by width and height
    var leftMax = (width / 2) + horizontalShift ;
    var rightMax = width - leftMax ;

    var topMax = (height / 2) + verticalShift ;
    var bottomMax = height - topMax ;

    // Find the minimum radius, that won't extend beyond the borders, then scale it
    return Math.min(leftMax, rightMax, topMax, bottomMax) * sizeRatio ;
  },

  plotSlice : function (x, y, radius, startAngle, endAngle, context) {
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, radius, startAngle, endAngle, false);
    context.lineTo(x, y);
    context.closePath();
  },
  hit : function (options) {

    var
      data      = options.data[0],
      args      = options.args,
      index     = options.index,
      mouse     = args[0],
      n         = args[1],
      slice     = this.slices[index],
      x         = mouse.relX - ((options.width / 2) + this.parseShift(options.horizontalShift, options.width)),
      y         = mouse.relY - ((options.height / 2) + this.parseShift(options.verticalShift, options.height)),
      r         = Math.sqrt(x * x + y * y),
      theta     = Math.atan(y / x),
      circle    = Math.PI * 2,
      explode   = slice.explode || options.explode,
      start     = slice.start % circle,
      end       = slice.end % circle,
      epsilon   = options.epsilon;

    if (x < 0) {
      theta += Math.PI;
    } else if (x > 0 && y < 0) {
      theta += circle;
    }

    if (r < slice.radius + explode && r > explode) {
      if (
          (theta > start && theta < end) || // Normal Slice
          (start > end && (theta < end || theta > start)) || // First slice
          // TODO: Document the two cases at the end:
          (start === end && ((slice.start === slice.end && Math.abs(theta - start) < epsilon) || (slice.start !== slice.end && Math.abs(theta-start) > epsilon)))
         ) {
          
          // TODO Decouple this from hit plugin (chart shouldn't know what n means)
         n.x = data[0];
         n.y = data[1];
         n.sAngle = start;
         n.eAngle = end;
         n.index = 0;
         n.seriesIndex = index;
         n.fraction = data[1] / this.total;
      }
    }
  },
  drawHit: function (options) {
    var
      context = options.context,
      slice = this.slices[options.args.seriesIndex];

    context.save();
    context.translate((options.width / 2) + this.parseShift(options.horizontalShift, options.width), (options.height / 2) + this.parseShift(options.verticalShift, options.height));
    this.plotSlice(slice.x, slice.y, slice.radius, slice.start, slice.end, context);
    context.stroke();
    context.restore();
  },
  clearHit : function (options) {
    var
      context = options.context,
      slice = this.slices[options.args.seriesIndex],
      padding = 2 * options.lineWidth,
      radius = slice.radius + padding;

    context.save();
    context.translate((options.width / 2) + this.parseShift(options.horizontalShift, options.width), (options.height / 2) + this.parseShift(options.verticalShift, options.height));
    context.clearRect(
      slice.x - radius,
      slice.y - radius,
      2 * radius + padding,
      2 * radius + padding 
    );
    context.restore();
  },
  extendYRange : function (axis, data) {
    this.total = (this.total || 0) + data[0][1];
  }
});
})();
