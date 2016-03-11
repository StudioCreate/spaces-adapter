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

/* global console */

/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Modeled after Node's util.inherits, which is licensed under the MIT license
 *   Implementation: https://github.com/joyent/node/blob/master/lib/util.js#L628
 *   License: https://github.com/joyent/node/blob/master/LICENSE
 *
 * @param {function} ctor Constructor function which needs to inherit the prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
export function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
}

/**
 * Throw an exception with the given message if the provided value is not truthy.
 *
 * @param {boolean} expression
 * @param {string} message
 */
export function assert (expression, message) {
    /*eslint no-console:0*/
    console.assert(expression, message);
}
