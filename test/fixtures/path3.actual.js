import * as path from 'path';
import * as fs from "fs";
const str = fs.readFileSync(path.join(__dirname + '/hello.txt'), 'utf8');
console.log(str);