(function () {

Flotr.ExampleList.add({
  key : 'negative-values',
  name : 'Negative Values',
  callback : negative_values
});

function negative_values (container) {

  var
    d0    = [], // Line through y = 0
    d1    = [], // Random data presented as a scatter plot. 
    d2    = [], // A regression line for the scatter. 
    sx    = 0,
    sy    = 0,
    sxy   = 0,
    sxsq  = 0,
    xmean,
    ymean,
    alpha,
    beta,
    n, x, y;

  for (n = 0; n < 20; n++){

    x = n;
    y = x + Math.random()*8 - 15;

    d0.push([x, 0]);
    d1.push([x, y]);

    // Computations used for regression line
    sx += x;
    sy += y;
    sxy += x*y;
    sxsq += Math.pow(x,2);
  }

  xmean = sx/n;
  ymean = sy/n;
  beta  = ((n*sxy) - (sx*sy))/((n*sxsq)-(Math.pow(sx,2)));
  alpha = ymean - (beta * xmean);
  
  // Compute the regression line.
  for (n = 0; n < 20; n++){
    d2.push([n, alpha + beta*n])
  }     

  // Draw the graph
  graph = Flotr.draw(
    container, [ 
      { data : d0, shadowSize : 0, color : '#545454' }, // Horizontal
      { data : d1, label : 'y = x + (Math.random() * 8) - 15', points : { show : true } },  // Scatter
      { data : d2, label : 'y = ' + alpha.toFixed(2) + ' + ' + beta.toFixed(2) + '*x' }  // Regression
    ],
    {
      legend : { position : 'se', backgroundColor : '#D2E8FF' },
      title : 'Negative Values'
    }
  );
};

})();
