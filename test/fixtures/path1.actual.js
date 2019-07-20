const fs = require('fs');
const path = require('path');
const str = fs.readFileSync(path.join(__dirname, '/hello.txt'), 'utf8');
console.log(str);
