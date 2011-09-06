<?php

class CSVParser {
  var $fp = null;
  var $delimiter = null;
  var $enclosure = null;
  
  function __construct($file, $delimiter = ',', $enclosure = '"'){
    $this->fp = fopen($file, 'r');
    $this->delimiter = $delimiter;
    $this->enclosure = $enclosure;
  }
  
  function __destruct(){
    fclose($this->fp);
  }
  
  function getFlotrData($lines_count = 1000000){
    $data = array();
    $ticks = array();
    
    $this->nextLine();
    $x = 0;
    while(($line = $this->nextLine()) && $lines_count--){
      $d = array($x);
      $i = 1;
      while ($i < 5 && $value = $line[$i++]) {
        $d[] = floatval($value);
      }
      $data[] = $d;
      $ticks[] = array($x, $line[0]);
      
      $x++;
    }
    return array('ticks' => $ticks, 'data' => $data);
  }
  
  function reset(){
    rewind($this->fp);
  }
  
  function nextLine(){
    return fgetcsv($this->fp, null, $this->delimiter, $this->enclosure);
  }
}

$parser = new CSVParser('http://ichart.finance.yahoo.com/table.csv?s=AAPL&a=00&b=1&c=1999&d=11&e=31&f=2020&g=m&ignore=.csv');

echo json_encode($parser->getFlotrData(30));

?>