var fs = require('fs');
var t = require('babel-types');
var template = require('babel-template');

var buffer = template('Buffer(CONTENT, ENC)');

module.exports = function (instance) {
  return {
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

      var result = fs.readFileSync(file, enc);

      // Submit new dependencies back to webpack/browserify.
      // This is currently a bit ugly, but it appears to be
      // a limitation of Babel's plugin architecture, there
      // is no documented/clean way of bubbling this back up
      // to the bundler.
      instance.onFile(file);

      if (isBuffer) {
        return buffer({
          CONTENT: t.stringLiteral(result),
          ENC: t.stringLiteral(enc)
        });
      }
      return t.stringLiteral(result.toString());
    }
  };
};

function notSupported (name) {
  return function () {
    throw new Error(name + ' is not supported yet by babel-plugin-static-fs. PRs welcome! :)');
  };
}
