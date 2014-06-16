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

/* global require, QUnit */

require.config({
    paths: {
        "bluebird" : "../bower_components/bluebird/js/browser/bluebird",
        "eventEmitter": "../bower_components/eventEmitter/EventEmitter",
        "lodash": "../bower_components/lodash/dist/lodash"
    },
    packages : [
        { name: "playground", location: "../lib" }
    ]
});

define(function (require) {
    "use strict";

    var _ = require("lodash");

    var _parseQueryString = function () {
        var queryString = window.location.search.substr(1), // trims off initial "?"
            parts = queryString.split("&"),
            result = {};

        parts.forEach(function (part) {
            var a = part.split("=");
            if (a.length === 2) {
                result[a[0]] = a[1];
            }
        });

        return result;
    };

    var TEST_SECTION_MAP = {
        unit : [
            "spec/version-test"
        ],
        lowlevel : [
            "spec/low-level-test"
        ],
        integration : [
            "spec/generator/generator-test",
            "spec/generator/generator-bridge-test"
        ]
    };

    var _loadTestsAndStart = function () {
        var parsedQueryString = _parseQueryString(),
            section = parsedQueryString.section || "unit",
            tests = [];

        if (section !== "all" && !TEST_SECTION_MAP.hasOwnProperty(section)) {
            section = "unit";
        }

        if (section === "all") {
            tests = Array.prototype.concat.apply([], _.values(TEST_SECTION_MAP));
        } else if (TEST_SECTION_MAP.hasOwnProperty(section)) {
            tests = TEST_SECTION_MAP[section];
        }

        require(tests, function () {
            // Start QUnit after all test specs are loaded
            QUnit.start();
        });
    };

    _loadTestsAndStart();
});