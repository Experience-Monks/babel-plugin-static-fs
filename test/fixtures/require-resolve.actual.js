const fs = require('fs');
const str = fs.readFileSync(require.resolve('./hello.txt'), 'utf8');
console.log(str);