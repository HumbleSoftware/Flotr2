/**
 * Donut
 *
 * Formats the donuts labels.
 * @param {Object} slice - Slice object
 * @return {String} Formatted donut label string
 */
(function () {

var
  _ = Flotr._;

Flotr.defaultDonutLabelFormatter = function (total, value, labelText) {
  return (100 * value / total).toFixed(2)+'%';
};

Flotr.addType('donut', {
  options: {
    show: false,           // => setting to true will show bars, false will hide
    lineWidth: 1,          // => in pixels
    fill: true,            // => true to fill the area from the line to the x axis, false for (transparent) no fill
    fillColor: null,       // => fill color
    fillOpacity: 0.6,      // => opacity of the fill color, set to 1 for a solid fill, 0 hides the fill
    explode: 6,            // => the number of pixels the splices will be far from the center
    sizeRatio: 0.6,        // => the size ratio of the donut relative to the plot 
    startAngle: Math.PI/4, // => the first slice start angle
    labelFormatter: Flotr.defaultDonutLabelFormatter,
    epsilon: 0.1,          // => how close do you have to get to hit empty slice
	sliceThickness: 20     // => thickness of each slice in the donut
  },
  
  startAngle: [],
  total: [],

  draw : function (options) {

	var startAngle = [];
	var endAngle = [];
	
    var
      data          = options.data,
      context       = options.context,
      lineWidth     = options.lineWidth,
      shadowSize    = options.shadowSize,
      sizeRatio     = options.sizeRatio,
      height        = options.height,
      width         = options.width,
      explode       = options.explode,
      color         = options.color,
      fill          = options.fill,
      fillStyle     = options.fillStyle,
      radius        = Math.min(width, height) * sizeRatio / 2,
	  thickness		= options.sliceThickness,
      value         = data[0][1],
	  layer			= data[0][0],
      html          = [],
      vScale        = 1,
      measure       = Math.PI * 2 * value / this.total[layer];
    startAngle[layer] = this.startAngle[layer] || (2 * Math.PI * options.startAngle); // TODO: this initial startAngle is already in radians (fixing will be test-unstable)
    endAngle[layer] = startAngle[layer] + measure;
	var
      bisection     = startAngle[layer] + measure / 2,
	  label         = options.labelFormatter(this.total[layer], value, options.labelText),
      explodeCoeff  = explode + radius + 4,
      distX         = Math.cos(bisection) * explodeCoeff,
      distY         = Math.sin(bisection) * explodeCoeff,
      textAlign     = distX < 0 ? 'right' : 'left',
      textBaseline  = distY > 0 ? 'top' : 'bottom',
      style,
      x, y;
    
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(1, vScale);

    x = Math.cos(bisection) * explode;
    y = Math.sin(bisection) * explode;

    // Shadows
    if (shadowSize > 0) {
      this.plotSlice(x + shadowSize, y + shadowSize, radius, thickness, layer, startAngle[layer], endAngle[layer], context);
      if (fill) {
        context.fillStyle = 'rgba(0,0,0,0.1)';
        context.fill();
      }
    }

	if (value > 0) {
	    this.plotSlice(x, y, radius, thickness, layer, startAngle[layer], endAngle[layer], context);
	    if (fill) {
	      context.fillStyle = fillStyle;
	      context.fill();
	    }
	    context.lineWidth = lineWidth;
	    context.strokeStyle = color;
	    context.stroke();
	}

    style = {
      size : options.fontSize * 1.2,
      color : options.fontColor,
      weight : 1.5
    };

    if (label) {
      if (options.htmlText || !options.textEnabled) {
		// iterate through slices and check for overlap
		_.each(this.slices, function (slice){
			// Get old bisection
			sliceBisect = slice.start + (slice.end-slice.start) / 2;
			// Check if close
			if (sliceBisect-bisection < 0 && sliceBisect-bisection > -0.3) {
				// Values close, move bisection up
				bisection += 0.3;
				adjustValues();
			} else if (sliceBisect-bisection < 0.3 && sliceBisect-bisection >= 0) {
				// Values close, move bisection down
				bisection -= 0.3;
				adjustValues();
			}
			
			function adjustValues() {
				// Adjust new values
		        distX         = Math.cos(bisection) * explodeCoeff;
		        distY         = Math.sin(bisection) * explodeCoeff;
		        textAlign     = distX < 0 ? 'right' : 'left';
		        textBaseline  = distY > 0 ? 'top' : 'bottom';
			}
		});
		
        divStyle = 'position:absolute;' + textBaseline + ':' + (height / 2 + (textBaseline === 'top' ? distY : -distY)) + 'px;';
        divStyle += textAlign + ':' + (width / 2 + (textAlign === 'right' ? -distX : distX)) + 'px;';
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
	this.startAngle[layer] = endAngle[layer];
    this.slices = this.slices || [];
    this.slices.push({
      radius : radius,
      x : x,
      y : y,
      explode : explode,
      start : startAngle[layer],
      end : endAngle[layer]
    });
  },
  plotSlice : function (x, y, radius, thickness, layer, startAngle, endAngle, context) {
	// Start path
	context.beginPath();
	// Move to inside arc start pt
	context.moveTo(x+Math.cos(startAngle)*(radius-thickness*(layer+1)), y+Math.sin(startAngle)*(radius-thickness*(layer+1)));
	// Line to outside arc start pt
	context.lineTo(x+Math.cos(startAngle)*(radius-thickness*(layer)), y+Math.sin(startAngle)*(radius-thickness*(layer)));
	// Outside arc
	context.arc(x, y, radius-thickness*(layer), startAngle, endAngle, false);
	// Line to inside arc end pt
	context.lineTo(x+Math.cos(endAngle)*(radius-thickness*(layer+1)), y+Math.sin(endAngle)*(radius-thickness*(layer+1)));
	// Inside arc
	context.arc(x, y, radius-thickness*(layer+1), endAngle, startAngle, true);
	// Close
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
      x         = mouse.relX - options.width / 2,
      y         = mouse.relY - options.height / 2,
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
         n.fraction = data[1] / this.total[layer];
      }
    }
  },
  drawHit: function (options) {
    var
      context = options.context,
      slice = this.slices[options.args.seriesIndex];

    context.save();
    context.translate(options.width / 2, options.height / 2);
    this.plotSlice(slice.x, slice.y, slice.radius, thickness, layer, slice.start, slice.end, context);
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
    context.translate(options.width / 2, options.height / 2);
    context.clearRect(
      slice.x - radius,
      slice.y - radius,
      2 * radius + padding,
      2 * radius + padding 
    );
    context.restore();
  },
  extendYRange : function (axis, data) {
	var layer = data[0][0];
    this.total[layer] = (this.total[layer] || 0) + data[0][1];
  }
});
})();
