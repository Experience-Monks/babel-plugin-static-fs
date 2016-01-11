var path = require('path');
var t = require('babel-types');

module.exports = {
  join: function () {
    var args = Array.prototype.slice.call(arguments);
    var str = path.join.apply(path, args);
    return t.valueToNode(str);
  },
  resolve: function () {
    var args = Array.prototype.slice.call(arguments);
    var str = path.resolve.apply(path, args);
    return t.valueToNode(str);
  }
};
