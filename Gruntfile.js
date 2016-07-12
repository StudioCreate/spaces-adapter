/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/* eslint-env node */

module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        eslint: {
            options: {
                configFile: ".eslintrc"
            },
            all: [
                "*.js",
                "src/**/*.js",
                "test/**/*.js",
                "examples/**/*.js",
                "!package.json",
                "!test/spec/low-level-test.js"
            ]
        },
        jscs: {
            src: "<%= eslint.all %>",
            options: {
                config: ".jscsrc",
                verbose: true
            }
        },
        jsdoc: {
            dist: {
                src: ["src"],
                options: {
                    destination: "docs/jsdoc",
                    recurse: true
                }
            }
        },
        jsonlint: {
            src: [
                "*.json",
                "src/**/*.json",
                "test/**/*.json"
            ]
        },
        lintspaces: {
            src: [
                "*",
                "src/**/*.json",
                "src/**/*.js"
            ],
            options: {
                newline: true,
                newlineMaximum: 1
            }
        },
        concurrent: {
            test: ["eslint", "jscs", "jsdoc", "jsonlint", "lintspaces"]
        }
    });

    grunt.loadNpmTasks("grunt-eslint");
    grunt.loadNpmTasks("grunt-jscs");
    grunt.loadNpmTasks("grunt-jsdoc");
    grunt.loadNpmTasks("grunt-jsonlint");
    grunt.loadNpmTasks("grunt-lintspaces");

    grunt.loadNpmTasks("grunt-concurrent");

    grunt.registerTask("seqtest", ["eslint", "jscs", "jsdoc", "jsonlint", "lintspaces"]);
    grunt.registerTask("test", ["concurrent:test"]);

    grunt.registerTask("default", ["test"]);
};
