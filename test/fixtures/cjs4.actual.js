const foo = require('fs').readFileSync;
const str = foo(__dirname + '/hello.txt', 'utf8');
console.log(str);
