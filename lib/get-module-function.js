var t = require('babel-types');

// For a path like this:
//
//    var fsModule = require('fs')
//    fsModule.readFileSync(...)
//
// Finds the binding for "fs" and returns
// the required/imported module name (fs)
// as well as the source function name (readFileSync)

module.exports = getModuleFunction;
function getModuleFunction (path) {
  t.assertCallExpression(path);
  var callee = path.node.callee;

  var moduleAndFunc = [];
  var binding;
  if (t.isIdentifier(callee)) {
    // e.g. foo()
    var localFunc = callee.name;

    // now we need to find the real module & function names
    // e.g. import { join as foo } from 'path'
    // e.g. const { join: foo } from 'path'
    binding = path.scope.getBinding(localFunc);
    moduleAndFunc = getImportRequireDetails(path, binding, localFunc);
  } else if (t.isMemberExpression(callee)) {
    // e.g. foo.bar()
    var localModule = callee.object.name; // e.g. foo
    var funcName = callee.property.name; // e.g. bar

    // find the real imported module/func
    binding = path.scope.getBinding(localModule);
    var details = getImportRequireDetails(path, binding, localModule);
    moduleAndFunc[0] = details[0];
    moduleAndFunc[1] = funcName;
  } else {
    bail();
  }
  return moduleAndFunc;
}

function getImportRequireDetails (path, binding, localVar) {
  var moduleName, funcName;
  var parent = binding.path.parentPath;
  if (t.isImportDeclaration(parent)) {
    // The module is imported with ES2015
    moduleName = parent.node.source.value;
    if (t.isImportDefaultSpecifier(binding.path)) {
      // e.g. import path from 'path'
      return [ moduleName ];
    } else if (t.isImportSpecifier(binding.path)) {
      // e.g. import { join, resolve } from 'path'
      // e.g. import { join as foo } from 'path'
      var imported = binding.path.node.imported;
      funcName = imported.name;
      return [ moduleName, funcName ];
    }
  } else {
    // The module is required with CommonJS
    var init = binding.path.node.init;
    if (t.isMemberExpression(init)) {
      // e.g. const foo = require('path').join;
      moduleName = extractRequiredModule(init.object);
      funcName = init.property.name;
      return [ moduleName, funcName ];
    } else if (t.isCallExpression(init)) {
      // e.g. const foo = require('path');
      moduleName = extractRequiredModule(init);

      t.assertVariableDeclarator(binding.path.node);
      var id = binding.path.node.id;
      if (t.isObjectPattern(id)) {
        // e.g. const { readFile, readFileSync } = require('path');
        // we need to pick the right var that matches the binding
        var matchProp = id.properties.filter(function (prop) {
          return prop.value.name === localVar;
        })[0];
        if (!matchProp) {
          throw new Error('Could not find a require() declaration for the local value ' + localVar);
        }
        return [ moduleName, matchProp.key.name ];
      } else {
        // e.g. const foo = require('path')
        return [ moduleName ];
      }
    } else {
      bail();
    }
  }
}

function bail () {
  throw new Error('babel-plugin-static-fs could not statically evaluate the "fs" source.\n' +
    'Please change your code to something simpler to evaluate, e.g.\n' +
    "  const path = require('path');\n" +
    "  const src = fs.readFileSync(path.join(__dirname, 'foo.txt'));\n");
}

function extractRequiredModule (node) {
  t.assertCallExpression(node);
  t.assertIdentifier(node.callee, { name: 'require' });
  var arg = node.arguments[0];
  t.assertStringLiteral(arg);
  return arg.value;
}
