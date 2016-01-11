var fs = require('fs'),
  path = require('path'),
  src = fs.readFileSync(path.join(__dirname, 'hello.txt'), 'utf8');
console.log(src);