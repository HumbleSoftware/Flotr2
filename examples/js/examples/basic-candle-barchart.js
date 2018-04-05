(function () {

Flotr.ExampleList.add({
  key : 'basic-candle-barchart',
  name : 'Basic Candle Barchart',
  callback : basic_candle
});

function basic_candle (container) {

  var
    d1 = [],
    price = 3.206,
    graph,
    i, a, b, c;

  for (i = 0; i < 50; i++) {
      a = Math.random();
      b = Math.random();
      c = (Math.random() * (a + b)) - b;
      d1.push([i, price, price + a, price - b, price + c]);
      price = price + c;
  }
    
  // Graph
  graph = Flotr.draw(container, [ d1 ], { 
    candles : { 
      show : true, 
      candleWidth : 0.6, 
      barcharts: true, 
      upFillColor: '#00A048', 
      downFillColor: '#CB2020' 
    },
    xaxis   : { noTicks : 10 }
  });
}

})();

