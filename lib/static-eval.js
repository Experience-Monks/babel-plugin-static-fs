var t = require('@babel/types');
var moduleDetails = require('./get-module-function');
var nodeResolve = require('resolve');
var browserResolve = require('browser-resolve');

function isRequireResolve (path) {
  return t.isCallExpression(path.node) &&
    t.isMemberExpression(path.node.callee) &&
    path.node.callee.object.name === 'require' &&
    path.node.callee.property.name === 'resolve';
}

function resolveSync (target, id, opts) {
  return (target === 'browser' ? browserResolve : nodeResolve).sync(
    id, {
      basedir: opts.basedir,
      paths: opts.paths
    }
  );
}

module.exports = evaluate;
function evaluate (opts, path, vars, modules, needsEval) {
  opts = opts || {};

  // save replaced path and nodes for store nodes
  const replacedList = [];
  const replaceWith = (path, node) => {
    replacedList.push({
      path: path,
      oldNode: path.node,
      newNode: node
    });
    path.replaceWith(node);
  };
  try {
    // Replace identifiers with known values
    path.traverse({
      Identifier: function (ident) {
        var key = ident.node.name;
        if (key in vars) {
          replaceWith(ident, t.valueToNode(vars[key]));
        }
      }
    });

    var argValues, computedNode;
    // `require.resolve(identifier)` is a CallExpression but cannot be evaluated with existing `evaluate()`
    if (isRequireResolve(path)) {
      // First evaluate all our arguments recursively
      argValues = path.get('arguments').map(function (arg) {
        return evaluate(opts, arg, vars, modules, true);
      });

      var id = argValues[0];
      var resolveOpts = argValues[1] || {};
      var target = opts.target || 'node';

      var str = resolveSync(target, id, {
        basedir: vars.__dirname,
        paths: resolveOpts.paths
      });

      computedNode = t.valueToNode(str);
      replaceWith(path, computedNode);
    } else if (t.isCallExpression(path.node)) {
      // Evaluate recursively if it's a function call
      // First evaluate all our arguments recursively
      argValues = path.get('arguments').map(function (arg) {
        return evaluate(opts, arg, vars, modules, true);
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
      computedNode = staticModule[moduleFunc].apply(staticModule, argValues);
      replaceWith(path, computedNode);
    } else if (t.isObjectExpression(path.node)) {
      var props = path.get('properties');
      var resultingObj = {};
      props.forEach(function (prop) {
        var node = prop.node;
        if (node.computed) {
          throw new Error('Cannot handle computed property keys in arguments for static-fs');
        }
        if (!t.isIdentifier(node.key)) {
          throw new Error('Can only handle simple { encoding: "hex" } type options in static-fs arguments');
        }
        var key = node.key.name;
        var val = prop.get('value').evaluate();
        if (!val.confident) {
          throw new Error('Could not evaluate "' + key + '" in the object expression for static-fs');
        }
        resultingObj[key] = val.value;
      });

      // We evaluated a *simple* object expression like { encoding: 'hex' }
      return resultingObj;
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
  } catch (error) {
    // restore to original nodes if evaluating error is happened
    replacedList.reverse().forEach(({ path, oldNode }) => {
      path.replaceWith(oldNode);
    });
    throw error;
  }
}
