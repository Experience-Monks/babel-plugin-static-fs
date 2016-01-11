import fs from 'fs';
const str = fs.readFileSync(__dirname + '/hello.txt', 'utf8');
console.log(str);
