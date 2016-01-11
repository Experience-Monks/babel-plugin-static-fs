import { readFileSync as foo } from 'fs';
const str = foo(__dirname + '/hello.txt', 'utf8');
console.log(str);
