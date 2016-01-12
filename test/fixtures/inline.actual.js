const str = require('fs').readFileSync(__dirname + '/hello.txt', { encoding: 'hex', flag: undefined });
console.log(str);
