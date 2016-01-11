var fs = require('fs'),
  src = fs.readFileSync(__dirname + '/hello.txt');
console.log(src);