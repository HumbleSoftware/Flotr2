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
    if (axis.options.timeFormat)
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

    var carry = 0, v = NaN, prev;
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
