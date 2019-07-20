const fs = require('fs');
const str = fs.readFileSync(require.resolve('./foo'), 'utf8');
console.log(str);