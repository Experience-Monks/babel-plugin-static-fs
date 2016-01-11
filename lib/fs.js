var fs = require('fs');
var t = require('babel-types');
var template = require('babel-template');

var buffer = template('Buffer(CONTENT, ENC)');

module.exports = {
  readFile: notSupported('readFile'),
  readdir: notSupported('readdir'),

  readdirSync: function (file) {
    var list = fs.readdirSync(file);
    return t.valueToNode(list);
  },

  readFileSync: function (file, enc) {
    var isBuffer = false;
    if (enc === null || enc === undefined) {
      isBuffer = true;
      enc = 'base64';
    }
    if (enc && typeof enc === 'object' && enc.encoding) {
      enc = enc.encoding;
    }

    if (isBuffer) {
      return buffer({
        CONTENT: t.stringLiteral(fs.readFileSync(file, enc)),
        ENC: t.stringLiteral(enc)
      });
    }

    var str = fs.readFileSync(file, enc);
    return t.stringLiteral(str);
  }
};

function notSupported (name) {
  return function () {
    throw new Error(name + ' is not supported yet by babel-plugin-static-fs. PRs welcome! :)');
  };
}
