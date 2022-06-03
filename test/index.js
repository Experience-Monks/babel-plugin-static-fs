var test = require('tape');
var path = require('path');
var babel = require('@babel/core');
var fs = require('fs');
var pluginPath = require.resolve('../');

test('babel plugin to accept browserify transforms', function (t) {
  run('cjs1', 'common', 'CommonJS require');
  run('cjs2', 'common', 'CommonJS require with destructure');
  run('cjs3', 'common', 'CommonJS require with destructure and local naming');
  run('cjs4', 'common', 'CommonJS require with member expression');
  run('cjs5', 'common', 'CommonJS require with node: protocol');

  run('es6-1', 'common', 'es6 basic import');
  run('es6-2', 'common', 'es6 destructured import');
  run('es6-3', 'common', 'es6 import with "as" statement');
  run('es6-4', 'common', 'es6 import with "as" statement and other declarations');
  run('es6-5', 'common', 'es6 import * as');
  run('es6-6', 'common', 'es6 node: protocol');

  run('path1', 'path1', 'path.join with CommonJS');
  run('path2', 'path2', 'path.join with es6');
  run('path3', 'path3', 'import * as path with es6');
  run('multi', 'multi', 'path.join with multi var');

  run('readdir', 'readdir', 'readdirSync');
  run('closure', 'closure', 'handles inside function');
  run('buffer', 'buffer', 'handles Buffer');
  run('hex', 'hex', 'handles encoding');

  run('require-resolve-module', 'require-resolve-module-node', 'require.resolve with node target');
  run('require-resolve-module', 'require-resolve-module-browser', 'require.resolve with browser target', {
    target: 'browser'
  });
  run('require-resolve', 'require-resolve', 'require.resolve with file');

  run('dynamic', 'dynamic', 'gracefully skips dynamic calls');
  throws('dynamic', 'dynamic', 'throws when dynamic is false', {
    dynamic: false
  });

  // Failing test:
  // run('inline', 'inline', 'handles inline fs require call');
  t.end();

  function run (name, expectedFile, msg, opts) {
    opts = opts || {};

    var fileIn = path.join(__dirname, 'fixtures', `${name}.actual.js`);
    var output = babel.transformFileSync(fileIn, {
      plugins: [
        [ pluginPath, opts ]
      ]
    });
    var fileOut = path.join(__dirname, 'fixtures', `${expectedFile}.expected.js`);
    var expected = fs.readFileSync(fileOut, 'utf8');
    t.equals(output.code, expected, `${name}.actual -> ${expectedFile}.expected: ${msg}`);
  }

  function throws (name, msg, opts) {
    opts = opts || {};
    t.throws(() => {
      var fileIn = path.join(__dirname, 'fixtures', `${name}.actual.js`);
      babel.transformFileSync(fileIn, {
        plugins: [
          [ pluginPath, opts ]
        ]
      });
    }, msg);
  }
});
