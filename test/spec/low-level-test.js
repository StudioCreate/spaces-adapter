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

/*jslint devel: true*/
/* global module, test, asyncTest, ok, _playground, expect, start */

define(function () {
    "use strict";

    module("low-level");

    /**
     * Validates that the returned result-value is a success code
     * 
     * @private
     * @param {Error=} err
     */
    var _validateNotifierResult = function (err) {
        // Acceptable success codes are: undefined, or an object with a
        // number property that has the value 0
        var testPasses = (err === undefined);
        if (!testPasses) {
            testPasses = (err.number !== undefined && err.number === 0);
        }

        ok(testPasses, "result is success");

        if (!testPasses) {
            console.log("validateNotifierResult failed for err:");
            console.log(err);
        }
    };

    /** 
     * Validates that the returned result-value is an error object containing
     * number and message properties. Other properties are possible too.
     * 
     * @private
     * @param {Error=} err
     * @param {number=} expectedError
     */
    var _validateNotifierResultError = function (err, expectedError) {

        var testPasses = false;
        do {
            if (err === undefined) {
                break;
            }
            if (!(err instanceof Error)) {
                break;
            }
            if (err.number === undefined) {
                break;
            }
            if (err.message === undefined) {
                break;
            }

            testPasses = true;
        } while (false);

        if (!testPasses) {
            console.log("Invalid form of an error resultValue:");
            console.log(err);
        } else {
            // test the returned error code
            // REVISIT: Replace the hard coded number with an enumeration
            // when that becomes available
            testPasses = (err.number === expectedError);

            if (!testPasses) {
                console.log("resultValue did not have the expected error code:" +
                    expectedError + " Actual error is: " + err.number);
            }
        }
        ok(testPasses, "error resultValue validation");
    };


    test("_playground object exists", function () {
        expect(1);
        ok(!!_playground, "_playground object exists");
    });

    test("_playground.ps property exists", function () {
        expect(1);
        ok(!!_playground.ps, "_playground.ps property exists");
    });

    test("_playground.ps.descriptor property exists", function () {
        expect(1);
        ok(!!_playground.ps.descriptor, "_playground.ps.descriptor property exists");
    });

    test("_playground.ps.ui property exists", function () {
        expect(1);
        ok(!!_playground.ps.ui, "_playground.ps.ui property exists");
    });

    test("_playground._debug property exists", function () {
        expect(1);
        ok(!!_playground._debug, "_playground.debug property exists");
    });

    // Basic test for obtaining a value with no arguments
    asyncTest("_playground.ps.ui.getScaleFactor property", function () {
        expect(2);

        _playground.ps.ui.getScaleFactor(function (err, scaleFactor) {
            _validateNotifierResult(err);

            var scaleFactorValidation = (scaleFactor === 1 || scaleFactor === 2);
            ok(scaleFactorValidation, "scale factor validation");

            if (!scaleFactorValidation) {
                console.log("scale factor not the expected value. returned value is: " + scaleFactor);
            }

            start();
        });
    });

    // Negative test: Invoke a host method without providing a notifier
    test("_playground.ps.ui.getScaleFactor property (negative)", function () {
        expect(1);

        var result;
        try {
            _playground.ps.ui.getScaleFactor("some value");
        } catch (err) {
            result = err;
        }

        ok(result !== undefined, "missing notifier exception");
    });

    // Negative test. Invoke a host method with an incorrect number/typs of arguments
    asyncTest("_playground._debug.forcePlayArgumentFailure", function () {
        expect(1);

        _playground._debug.forcePlayArgumentFailure(function (err) {
            _validateNotifierResultError(err, 1003);

            start();
        });
    });
});
