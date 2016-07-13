Photoshop Spaces Adapter [![Build Status](https://travis-ci.org/adobe-photoshop/spaces-adapter.svg?branch=master)](https://travis-ci.org/adobe-photoshop/spaces-adapter)
=================

This repository contains:

1. A collection of JavaScript modules, which wrap the low-level Spaces plug-in API into a more friendly, mid-level API.
2. A library of action descriptors, which can be submitted to the Spaces plug-in to drive Photoshop and inspect its state.

These modules are a dependency of the Photoshop Design Space application. For more information, see the [spaces-design repository](https://github.com/adobe-photoshop/spaces-design/).

Usage
-----

This repository is meant only as code storage. There is no bundled file / usable ES5 javascript.
To use these files in your ES6 project, one way is to use Webpack.

First, add spaces-adapter sources as a resolve alias:

```
{
    resolve: {
        alias: {
            "spaces-adapter": path.join(__dirname, "node_modules/spaces-adapter/src")
        }
    }
}
```

In your webpack config, change babel-loader exclude rule to ignore `node_modules/spaces-adapter` folder.

```
{
    module: {
        loaders: {
            // ES6 transpiling
            test: /\.jsx?$/,
            exclude: /((node_modules)\/(?!spaces-adapter))/,
            loader: "babel",
            query: {
                presets: ["es2015"]
            }
        }
    }
}
```

Contributing
------------

We welcome your contributions! Please see [CONTRIBUTING.md](https://github.com/adobe-photoshop/spaces-adapter/blob/master/CONTRIBUTING.md) for more details.

License
-------

(MIT License)

Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 
Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.

Third-Party Code
----------------

A list of third-party code used by this project is available at https://github.com/adobe-photoshop/spaces-adapter/wiki/Third-party-code
