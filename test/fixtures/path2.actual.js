import { readFileSync } from 'fs';
import { join } from 'path';
const str = readFileSync(join(__dirname, '/hello.txt'), 'utf8');
console.log(str);
