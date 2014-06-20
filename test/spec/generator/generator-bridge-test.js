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

/* global module, test, asyncTest, expect, ok, equal, start */

define(function (require) {
    "use strict";

    var _ = require("lodash"),
        generator = require("playground/generator");

    module("Generator Bridge");

    test("Bridge domain is created", function () {
        expect(1);

        ok(generator.bridge, "Bridge domain created");
    });

    asyncTest("Bridge domain becomes ready", function () {
        expect(1);

        generator.bridge._domain.promise()
            .then(function () {
                ok(generator.bridge._domain.ready(), "Bridge domain is ready");
            })
            .catch(function () {
                ok(false);
            })
            .finally(function () {
                start();
            });
    });

    asyncTest("getOpenDocumentIDs returns an array", function () {
        expect(1);

        generator.bridge.getOpenDocumentIDs()
            .then(function (ids) {
                ok(_.isArray(ids), "Result is an array");
            })
            .catch(function () {
                ok(false);
            })
            .finally(function () {
                start();
            });
    });
    
    asyncTest("getDocumentInfo returns an object", function () {
        expect(1);

        generator.bridge.getOpenDocumentIDs()
            .then(function (ids) {
                var id = ids.length > 0 ? ids[0] : null;
                return generator.bridge.getDocumentInfo(id)
                    .then(function (info) {
                        equal(info.id, id, "Result has correct ID");
                    })
                    .catch(function (err) {
                        equal(err, "Error: No image open", "No document is open");
                    });
            })
            .catch(function () {
                ok(false);
            })
            .finally(function () {
                start();
            });
    });

    asyncTest("evaluateJSXString returns the result of ExtendScript evaluation", function () {
        expect(1);

        // In Photoshop, app.typename === "Application"

        generator.bridge.evaluateJSXString("app.typename")
            .then(function (response) {
                equal(response, "Application");
            })
            .catch(function () {
                ok(false);
            })
            .finally(function () {
                start();
            });
    });
});
