import fs from 'fs';

module.exports = function () {
  return fs.readFileSync(__dirname + '/hello.txt', 'utf8');
};