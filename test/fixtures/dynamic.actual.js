const fs = require('fs');
const path = require('path');
const str = fs.readFileSync(path.join(__dirname, '/hello.txt'), 'utf8');
console.log(str);

function evaluated (blah) {
  const result = fs.readFileSync(path.join(__dirname, blah), 'utf8');
  console.log(result);
}

setTimeout(() => evaluated('/hello.txt'), 1500);