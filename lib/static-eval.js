var t = require('babel-types');
var moduleDetails = require('./get-module-function');

module.exports = evaluate;
function evaluate (path, vars, modules, needsEval) {
  // Replace identifiers with known values
  path.traverse({
    Identifier: function (ident) {
      var key = ident.node.name;
      if (key in vars) {
        ident.replaceWith(t.valueToNode(vars[key]));
      }
    }
  });

  // Evaluate recursively if it's a function call
  if (t.isCallExpression(path.node)) {
    // First evaluate all our arguments recursively
    var argValues = path.get('arguments').map(function (arg) {
      return evaluate(arg, vars, modules, true);
    });

    // Now determine which static module & method name to call
    var details = moduleDetails(path);
    var moduleName = details[0];
    var moduleFunc = details[1];

    // Some safeguards
    if (!(moduleName in modules)) {
      throw new Error('Cannot evaluate ' + moduleName + '->' + moduleFunc + ', no known static module.');
    }
    var staticModule = modules[moduleName];
    if (!(moduleFunc in staticModule)) {
      throw new Error('The module "' + moduleName + '" does not seem to export ' + moduleFunc);
    }

    // Call our method and replace current path
    var computedNode = staticModule[moduleFunc].apply(staticModule, argValues);
    path.replaceWith(computedNode);
  }

  // Evaluate the new AST
  if (needsEval) {
    var result = path.evaluate();
    if (!result.confident) {
      throw new Error('Not able to statically evaluate the expression(s) for babel-plugin-static-fs.\n' +
          'Try changing your source code to something that can be evaluated at build-time, e.g.\n' +
          "    const src = fs.readFileSync(__dirname + '/foo.txt', 'utf8');\n");
    }
    return result.value;
  }
}
