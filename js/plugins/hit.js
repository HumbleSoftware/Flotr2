(function () {

var
  D = Flotr.DOM,
  _ = Flotr._,
  flotr = Flotr,
  S_MOUSETRACK = 'opacity:0.7;background-color:#000;color:#fff;position:absolute;padding:2px 8px;-moz-border-radius:4px;border-radius:4px;white-space:nowrap;';

Flotr.addPlugin('hit', {
  callbacks: {
    'flotr:mousemove': function(e, pos) {
      this.hit.track(pos);
    },
    'flotr:click': function(pos) {
      var
        hit = this.hit.track(pos);
      if (hit && !_.isUndefined(hit.index)) pos.hit = hit;
    },
    'flotr:mouseout': function(e) {
      if (e.relatedTarget !== this.mouseTrack) {
        this.hit.clearHit();
      }
    },
    'flotr:destroy': function() {
      if (this.options.mouse.container) {
        D.remove(this.mouseTrack);
      }
      this.mouseTrack = null;
    }
  },
  track : function (pos) {
    if (this.options.mouse.track || _.any(this.series, function(s){return s.mouse && s.mouse.track;})) {
      return this.hit.hit(pos);
    }
  },
  /**
   * Try a method on a graph type.  If the method exists, execute it.
   * @param {Object} series
   * @param {String} method  Method name.
   * @param {Array} args  Arguments applied to method.
   * @return executed successfully or failed.
   */
  executeOnType: function(s, method, args){
    var
      success = false,
      options;

    if (!_.isArray(s)) s = [s];

    function e(s, index) {
      _.each(_.keys(flotr.graphTypes), function (type) {
        if (s[type] && s[type].show && !s.hide && this[type][method]) {
          options = this.getOptions(s, type);

          options.fill = !!s.mouse.fillColor;
          options.fillStyle = this.processColor(s.mouse.fillColor || '#ffffff', {opacity: s.mouse.fillOpacity});
          options.color = s.mouse.lineColor;
          options.context = this.octx;
          options.index = index;

          if (args) options.args = args;
          this[type][method].call(this[type], options);
          success = true;
        }
      }, this);
    }
    _.each(s, e, this);

    return success;
  },
  /**
   * Updates the mouse tracking point on the overlay.
   */
  drawHit: function(n){
    var octx = this.octx,
      s = n.series;

    if (s.mouse.lineColor) {
      octx.save();
      octx.lineWidth = (s.points ? s.points.lineWidth : 1);
      octx.strokeStyle = s.mouse.lineColor;
      octx.fillStyle = this.processColor(s.mouse.fillColor || '#ffffff', {opacity: s.mouse.fillOpacity});
      octx.translate(this.plotOffset.left, this.plotOffset.top);

      if (!this.hit.executeOnType(s, 'drawHit', n)) {
        var
          xa = n.xaxis,
          ya = n.yaxis;

        octx.beginPath();
          // TODO fix this (points) should move to general testable graph mixin
          octx.arc(xa.d2p(n.x), ya.d2p(n.y), s.points.hitRadius || s.points.radius || s.mouse.radius, 0, 2 * Math.PI, true);
          octx.fill();
          octx.stroke();
        octx.closePath();
      }
      octx.restore();
      this.clip(octx);
    }
    this.prevHit = n;
  },
  /**
   * Removes the mouse tracking point from the overlay.
   */
  clearHit: function(){
    var prev = this.prevHit,
        octx = this.octx,
        plotOffset = this.plotOffset;
    octx.save();
    octx.translate(plotOffset.left, plotOffset.top);
    if (prev) {
      if (!this.hit.executeOnType(prev.series, 'clearHit', this.prevHit)) {
        // TODO fix this (points) should move to general testable graph mixin
        var
          s = prev.series,
          lw = (s.points ? s.points.lineWidth : 1);
          offset = (s.points.hitRadius || s.points.radius || s.mouse.radius) + lw;
        octx.clearRect(
          prev.xaxis.d2p(prev.x) - offset,
          prev.yaxis.d2p(prev.y) - offset,
          offset*2,
          offset*2
        );
      }
      D.hide(this.mouseTrack);
      this.prevHit = null;
    }
    octx.restore();
  },
  /**
   * Retrieves the nearest data point from the mouse cursor. If it's within
   * a certain range, draw a point on the overlay canvas and display the x and y
   * value of the data.
   * @param {Object} mouse - Object that holds the relative x and y coordinates of the cursor.
   */
  hit : function (mouse) {

    var
      options = this.options,
      prevHit = this.prevHit,
      closest, sensibility, dataIndex, seriesIndex, series, value, xaxis, yaxis, n;

    if (this.series.length === 0) return;

    // Nearest data element.
    // dist, x, y, relX, relY, absX, absY, sAngle, eAngle, fraction, mouse,
    // xaxis, yaxis, series, index, seriesIndex
    n = {
      relX : mouse.relX,
      relY : mouse.relY,
      absX : mouse.absX,
      absY : mouse.absY,
      series: this.series
    };

    if (options.mouse.trackY &&
        !options.mouse.trackAll &&
        this.hit.executeOnType(this.series, 'hit', [mouse, n]) &&
        !_.isUndefined(n.seriesIndex))
      {
      series    = this.series[n.seriesIndex];
      n.series  = series;
      n.mouse   = series.mouse;
      n.xaxis   = series.xaxis;
      n.yaxis   = series.yaxis;
    } else {

      closest = this.hit.closest(mouse);

      if (closest) {

        closest     = options.mouse.trackY ? closest.point : closest.x;
        seriesIndex = closest.seriesIndex;
        series      = this.series[seriesIndex];
        xaxis       = series.xaxis;
        yaxis       = series.yaxis;
        sensibility = 2 * series.mouse.sensibility;

        if
          (options.mouse.trackAll ||
          (closest.distanceX < sensibility / xaxis.scale &&
          (!options.mouse.trackY || closest.distanceY < sensibility / yaxis.scale)))
        {
          n.series      = series;
          n.xaxis       = series.xaxis;
          n.yaxis       = series.yaxis;
          n.mouse       = series.mouse;
          n.x           = closest.x;
          n.y           = closest.y;
          n.dist        = closest.distance;
          n.index       = closest.dataIndex;
          n.seriesIndex = seriesIndex;
        }
      }
    }

    if (!prevHit || (prevHit.index !== n.index || prevHit.seriesIndex !== n.seriesIndex)) {
      this.hit.clearHit();
      if (n.series && n.mouse && n.mouse.track) {
        this.hit.drawMouseTrack(n);
        this.hit.drawHit(n);
        Flotr.EventAdapter.fire(this.el, 'flotr:hit', [n, this]);
      }
    }

    return n;
  },

  closest : function (mouse) {

    var
      series    = this.series,
      options   = this.options,
      relX      = mouse.relX,
      relY      = mouse.relY,
      compare   = Number.MAX_VALUE,
      compareX  = Number.MAX_VALUE,
      closest   = {},
      closestX  = {},
      check     = false,
      serie, data,
      distance, distanceX, distanceY,
      mouseX, mouseY,
      x, y, i, j;

    function setClosest (o) {
      o.distance = distance;
      o.distanceX = distanceX;
      o.distanceY = distanceY;
      o.seriesIndex = i;
      o.dataIndex = j;
      o.x = x;
      o.y = y;
      check = true;
    }

    for (i = 0; i < series.length; i++) {

      serie = series[i];
      data = serie.data;
      mouseX = serie.xaxis.p2d(relX);
      mouseY = serie.yaxis.p2d(relY);

      if (serie.hide) continue;

      for (j = data.length; j--;) {

        x = data[j][0];
        y = data[j][1];
        // Add stack offset if exists
        if (data[j].y0) y += data[j].y0;

        if (x === null || y === null) continue;

        // don't check if the point isn't visible in the current range
        if (x < serie.xaxis.min || x > serie.xaxis.max) continue;

        distanceX = Math.abs(x - mouseX);
        distanceY = Math.abs(y - mouseY);

        // Skip square root for speed
        distance = distanceX * distanceX + distanceY * distanceY;

        if (distance < compare) {
          compare = distance;
          setClosest(closest);
        }

        if (distanceX < compareX) {
          compareX = distanceX;
          setClosest(closestX);
        }
      }
    }

    return check ? {
      point : closest,
      x : closestX
    } : false;
  },

  drawMouseTrack : function (n) {

    var
      pos         = '', 
      s           = n.series,
      p           = n.mouse.position, 
      m           = n.mouse.margin,
      x           = n.x,
      y           = n.y,
      elStyle     = S_MOUSETRACK,
      mouseTrack  = this.mouseTrack,
      plotOffset  = this.plotOffset,
      left        = plotOffset.left,
      right       = plotOffset.right,
      bottom      = plotOffset.bottom,
      top         = plotOffset.top,
      decimals    = n.mouse.trackDecimals,
      options     = this.options,
      container   = options.mouse.container,
      oTop        = 0,
      oLeft       = 0,
      offset, size, content;

    // Create
    if (!mouseTrack) {
      mouseTrack = D.node('<div class="flotr-mouse-value" style="'+elStyle+'"></div>');
      this.mouseTrack = mouseTrack;
      D.insert(container || this.el, mouseTrack);
    }

    // Fill tracker:
    if (!decimals || decimals < 0) decimals = 0;
    if (x && x.toFixed) x = x.toFixed(decimals);
    if (y && y.toFixed) y = y.toFixed(decimals);
    content = n.mouse.trackFormatter({
      x: x,
      y: y,
      series: n.series,
      index: n.index,
      nearest: n,
      fraction: n.fraction
    });
    if (_.isNull(content) || _.isUndefined(content)) {
      D.hide(mouseTrack);
      return;
    } else {
      mouseTrack.innerHTML = content;
      D.show(mouseTrack);
    }

    // Positioning
    if (!p) {
      return;
    }
    size = D.size(mouseTrack);
    if (container) {
      offset = D.position(this.el);
      oTop = offset.top;
      oLeft = offset.left;
    }

    if (!n.mouse.relative) { // absolute to the canvas
      pos += 'top:';
      if      (p.charAt(0) == 'n') pos += (oTop + m + top);
      else if (p.charAt(0) == 's') pos += (oTop - m + top + this.plotHeight - size.height);
      pos += 'px;bottom:auto;left:';
      if      (p.charAt(1) == 'e') pos += (oLeft - m + left + this.plotWidth - size.width);
      else if (p.charAt(1) == 'w') pos += (oLeft + m + left);
      pos += 'px;right:auto;';

    // Pie
    } else if (s.pie && s.pie.show) {
      var center = {
          x: (this.plotWidth)/2,
          y: (this.plotHeight)/2
        },
        radius = (Math.min(this.canvasWidth, this.canvasHeight) * s.pie.sizeRatio) / 2,
        bisection = n.sAngle<n.eAngle ? (n.sAngle + n.eAngle) / 2: (n.sAngle + n.eAngle + 2* Math.PI) / 2;
      
      pos += 'bottom:' + (m - top - center.y - Math.sin(bisection) * radius/2 + this.canvasHeight) + 'px;top:auto;';
      pos += 'left:' + (m + left + center.x + Math.cos(bisection) * radius/2) + 'px;right:auto;';

    // Default
    } else {
      pos += 'top:';
      if (/n/.test(p)) pos += (oTop - m + top + n.yaxis.d2p(n.y) - size.height);
      else             pos += (oTop + m + top + n.yaxis.d2p(n.y));
      pos += 'px;bottom:auto;left:';
      if (/w/.test(p)) pos += (oLeft - m + left + n.xaxis.d2p(n.x) - size.width);
      else             pos += (oLeft + m + left + n.xaxis.d2p(n.x));
      pos += 'px;right:auto;';
    }

    // Set position
    mouseTrack.style.cssText = elStyle + pos;

    if (n.mouse.relative) {
      if (!/[ew]/.test(p)) {
        // Center Horizontally
        mouseTrack.style.left =
          (oLeft + left + n.xaxis.d2p(n.x) - D.size(mouseTrack).width / 2) + 'px';
      } else
      if (!/[ns]/.test(p)) {
        // Center Vertically
        mouseTrack.style.top =
          (oTop + top + n.yaxis.d2p(n.y) - D.size(mouseTrack).height / 2) + 'px';
      }
    }
  }

});
})();
