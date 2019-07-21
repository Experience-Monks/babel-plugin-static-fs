var pathModule = require('path');
var staticEval = require('./lib/static-eval');
var staticFsModule = require('./lib/fs');
var staticPathModule = require('./lib/path');
var noop = function () {};

module.exports = function (babel) {
  var t = babel.types;

  var staticModuleName = 'fs';

  // Handles new dependencies being added
  // to our tool chain. This is a limitation
  // of Babel + bundler integrations.
  // See here:
  // https://github.com/babel/babelify/issues/173
  var depManager = {
    onFile: noop
  };

  var modules = {
    path: staticPathModule,
    fs: staticFsModule(depManager)
  };

  // Finds require/import statements
  var Detective = {
    ImportDeclaration: function (path, state) {
      if (path.node.source.value === staticModuleName) {
        var vars = path.node.specifiers.map(function (spec) {
          return spec.local.name;
        });

        // now traverse and replace all instances within the scope
        var func = path.getFunctionParent();
        if (!func) {
          func = path.findParent(p => p.isProgram());
        }

        var errors = traverse(func, vars, state);

        // finally, remove the 'fs' import statements
        if (errors.length === 0) path.remove();
      }
    },
    CallExpression: function (path, state) {
      var callee = path.node.callee;
      if (t.isIdentifier(callee, { name: 'require' })) {
        var arg = path.node.arguments[0];
        var pathToRemove = path.parentPath;

        // We found "require(fs)"
        if (t.isStringLiteral(arg, { value: staticModuleName })) {
          var id = path.parentPath.node.id;
          var vars = [];

          if (t.isObjectPattern(id)) {
            // e.g. const { readFileSync: foo, readFile } = require('fs')
            vars = id.properties.map(function (prop) {
              return prop.value.name;
            });
          } else if (t.isIdentifier(id)) {
            // e.g. const fs = require('fs')
            vars.push(id.name);
          } else if (t.isMemberExpression(path.parentPath.node)) {
            // e.g. const readFileSync = require('fs').readFileSync
            var memberExpr = path.parentPath;
            var memberParent = memberExpr.parentPath;

            if (t.isVariableDeclarator(memberParent)) {
              vars.push(memberParent.node.id.name);
              pathToRemove = memberParent.parentPath;
            } else {
              t.assertCallExpression(memberParent);
              throw new Error('Inline CommonJS statements are not yet supported by static-fs');
            }
          } else {
            throw new Error('Could not statically evaluate how the ' + staticModuleName + ' module was required/imported.');
          }

          // now traverse and replace all instances within the scope
          var func = path.getFunctionParent();
          if (!func) {
            func = path.findParent(p => p.isProgram());
          }

          var errors = traverse(func, vars, state);

          // finally, remove the 'fs' require statements
          if (errors.length === 0) pathToRemove.remove();
        }
      }
    }
  };

  return {
    visitor: Detective
  };

  function traverse (func, vars, state) {
    const errors = [];
    func.traverse(fsApiVisitor(vars, state, errors));
    return errors;
  }

  function evaluate (opts, path, file) {
    var vars = {
      __filename: file,
      __dirname: pathModule.dirname(file)
    };
    return staticEval(opts, path, vars, modules);
  }

  function fsApiVisitor (vars, state, errors) {
    return {
      CallExpression: function (path) {
        var callee = path.node.callee;
        if ((t.isMemberExpression(callee) &&
              vars.indexOf(callee.object.name) >= 0) ||
            (t.isIdentifier(callee) &&
              vars.indexOf(callee.name) >= 0)) {
          // Ensure new dependencies are emitted back to the bundler.
          if (state.opts && typeof state.opts.onFile === 'function') {
            depManager.onFile = state.opts.onFile;
          }

          // e.g. readFileSync(...) -> 'foobar'
          // e.g. fs.readFileSync(...) -> 'foobar'
          try {
            evaluate(state.opts, path, state.file.opts.filename);
          } catch (err) {
            if (state.opts.dynamic !== false) {
              errors.push(err);
            } else {
              throw err;
            }
          }
        }
      }
    };
  }
};
