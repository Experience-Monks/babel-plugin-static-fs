var pathModule = require('path');
var staticEval = require('./lib/static-eval');
var staticFsModule = require('./lib/fs');
var staticPathModule = require('./lib/path');

module.exports = function (babel) {
  var t = babel.types;

  var staticModuleName = 'fs';
  var modules = {
    path: staticPathModule,
    fs: staticFsModule
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
        func.traverse(fsApiVisitor(vars, state));

        // finally, remove the 'fs' import statements
        path.remove();
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
            var varDeclarator = memberExpr.parentPath;
            t.assertVariableDeclarator(varDeclarator);
            vars.push(varDeclarator.node.id.name);
            pathToRemove = varDeclarator.parentPath;
          } else {
            throw new Error('Could not statically evaluate how the ' + staticModuleName + ' module was required/imported.');
          }

          // now traverse and replace all instances within the scope
          var func = path.getFunctionParent();
          func.traverse(fsApiVisitor(vars, state));

          // finally, remove the 'fs' require statements
          pathToRemove.remove();
        }
      }
    }
  };

  return {
    visitor: Detective
  };

  function evaluate (path, file) {
    var vars = {
      __filename: file,
      __dirname: pathModule.dirname(file)
    };
    return staticEval(path, vars, modules);
  }

  function fsApiVisitor (vars, state) {
    return {
      CallExpression: function (path) {
        var callee = path.node.callee;
        if ((t.isMemberExpression(callee) &&
              vars.indexOf(callee.object.name) >= 0) ||
            (t.isIdentifier(callee) &&
              vars.indexOf(callee.name) >= 0)) {
          // e.g. readFileSync(...) -> 'foobar'
          // e.g. fs.readFileSync(...) -> 'foobar'
          evaluate(path, state.file.opts.filename);
        }
      }
    };
  }
};
