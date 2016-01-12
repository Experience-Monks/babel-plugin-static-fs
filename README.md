# babel-plugin-static-fs

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

A babel plugin to statically inline [Node `fs` calls](https://nodejs.org/api/fs.html). This is useful for building "universal" JavaScript (code that targets the browser and server) and [bundler-agnostic modules](https://gist.github.com/mattdesl/aaf759da84cc44c22305).

It also can be used as a replacement for [brfs](https://github.com/substack/brfs) in some cases – adding source maps, cleaner output code, ES2015 import support, and more robust handling of unusual syntax.

For example, say you have the following ES2015 source:

```js
import { readFileSync } from 'fs';
import { join } from 'path';
const src = readFileSync(join(__dirname, 'hello.txt'), 'utf8');
```

And `hello.txt` is a text file containing the string `"Hello, World!"`.

After transformation, it will look like this:

```js
import { join } from 'path';
const src = 'Hello, World!';
```

Your ES5 (npm) distribution code is now usable in Node, Browserify, Webpack, JSPM, and everything in between.

## Features

Currently supports CommonJS `require()` statements and common flavours of ES2015 `import` (no wild cards).

The following `fs` functions are supported:

- `fs.readFileSync(filepath, [enc])`
- `fs.readdirSync(filepath)`

The following `path` functions will be evaluated statically when they are found inside the arguments of the above calls:

- `path.join()`
- `path.resolve()`

## Install

```sh
npm install babel-plugin-static-fs --save-dev
```

After installing, you will need to add it to your `.babelrc` as a new plugin, or set it up as an option to babelify or Webpack's babel-loader.

For example, in browserify:

```sh
browserify src/index.js -t [ babelify --plugins static-fs ]
```

## Usage

See babel docs for more info on using plugins.

You can specify an `onFile` function to the plugin to receive new dependencies.

```js
var staticFs = require('babel-plugin-static-fs');
var babel = require('babel-core');

var result = babel.transform(input, {
  plugins: [
    [ staticFs, {
      onFile: onFile
    } ]
  ],
  filename: filename
});

function onFile (file) {
  console.log('Discovered new dependency:', file);
}
```

## File Watching & Re-Compilation

Since this introduces a new dependency in your graph at build-time, it might not get picked up by file watchers like `watchify`, `budo`, `webpack`, et al.

This seems to be a limitation in the babel + bundler bridge; see [here](https://github.com/babel/babelify/issues/173).

To get around this in Browserify, you can use [brfs-babel](https://www.npmjs.com/package/babel-brfs) which replaces `brfs`.

```sh
watchify index.js -t brfs-babel
```

## Contributing

This module only supported a limited subset of `fs`. In future, it would be nice to support more features, such as `readFile` and `readdir`. Please open an issue if you would like to help contribute.

## License

MIT, see [LICENSE.md](http://github.com/Jam3/babel-plugin-static-fs/blob/master/LICENSE.md) for details.
