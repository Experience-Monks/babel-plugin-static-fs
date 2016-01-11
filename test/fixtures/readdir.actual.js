var fs = require('fs'),
  path = require('path'),
  src = fs.readdirSync(path.join(__dirname, 'dir'));
console.log(src);