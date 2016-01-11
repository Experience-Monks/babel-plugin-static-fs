const { readFile, readFileSync: foo } = require('fs');
const str = foo(__dirname + '/hello.txt', 'utf8');
console.log(str);
