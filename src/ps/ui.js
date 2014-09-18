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

/* global _playground */

define(function (require, exports, module) {
    "use strict";

    var EventEmitter = require("eventEmitter"),
        util = require("../util"),
        Promise = require("bluebird");

    /**
     * Promisified version of low-level keyboard focus functions
     */
    var _ui = Promise.promisifyAll(_playground.ps.ui);

    /**
     * The UI object provides helper methods for dealing with the
     * low-level native binding to Photoshop. This object will typically
     * not be used by user-level code.
     *
     * Emits low-level Photoshop events such as "select" with
     * the following parameters:
     *    1. @param {?} info about the event, dependent on event type (Note:
     *           this should become more specific as the native interface is
     *           further defined.)
     *
     * @extends EventEmitter
     * @constructor
     * @private
     */
    var UI = function () {
        EventEmitter.call(this);
    };
    util.inherits(UI, EventEmitter);

    /**
     * Overscroll modes
     * 
     * @const
     * @type{object.<number>}
     */
    UI.prototype.overscrollMode = _playground.ps.ui.overscrollMode;

    /**
     * Get the current Photoshop overscroll mode.
     * 
     * @see UI.prototype.overscrollMode
     * @return {Promise.<number>} Resolves with the overscroll mode
     */
    UI.prototype.getOverscrollMode = function () {
        return _ui.getOverscrollModeAsync();
    };

    /**
     * Set the current Photoshop overscroll mode.
     * 
     * @see UI.prototype.overscrollMode
     * @param {number} mode The desired overscroll model
     * @return {Promise.<number>} Resolves once the overscroll mode is set
     */
    UI.prototype.setOverscrollMode = function (mode) {
        var options = {
            mode: mode
        };

        return _ui.setOverscrollModeAsync(options);
    };

    /**
     * Determines whether the scrollbars are currently suppressed.
     * 
     * @return {Promise.<boolean>}
     */
    UI.prototype.getSuppressScrollbars = function () {
        return _ui.getSuppressScrollbarsAsync();
    };

    /**
     * Sets whether or not the scrollbars should be suppressed.
     * 
     * @param {boolean} suppress Whether or not the scrollbars should be suppressed
     * @return {Promise}
     */
    UI.prototype.setSuppressScrollbars = function (suppress) {
        return _ui.setSuppressScrollbarsAsync(suppress);
    };

    /**
     * Pointer propagation modes
     * ALPHA_PROPAGATE: Default behavior, events will be sent to Playground
     * if they're clicking on a Playground view
     * ALWAYS_PROPAGATE: Playground will never get a pointer event
     * NEVER_PROPAGATE: Playground consumes all pointer events
     */
    UI.prototype.pointerPropagationMode = _playground.ps.ui.pointerPropagationMode;

    /**
     * Keyboard propagation modes
     * FOCUS_PROPAGATE: Default behavior, events will be sent to in focus element
     * ALWAYS_PROPAGATE: Playground will never get a keyboard event
     * NEVER_PROPAGATE: Playground consumes all keyboard events
     */
    UI.prototype.keyboardPropagationMode = _playground.ps.ui.keyboardPropagationMode;

    /**
     * Policy action modes
     * Numerically, they're identical for keyboard and pointer
     * ALPHA_PROPAGATE (applies as FOCUS_PROPAGATE on Keyboard events)
     * ALWAYS_PROPAGATE
     * NEVER_PROPAGATE
     */
    UI.prototype.policyAction = _playground.ps.ui.policyAction;

    /**
     * Gets the mode of pointer propagation determining the rules of
     * what mouse events will be trickled down to Playground layer.
     * 
     * @return {Promise.<_ui.policyAction>}
     */
    UI.prototype.getPointerPropagationMode = function () {
        return _ui.getPointerPropagationModeAsync();
    };

    /**
     * Set the pointer propagation mode
     * 
     * @param {string} mode What level of mouse events to pass to Playground
     *  possible values defined in UI.prototype.pointerPropagationMode
     * @return {Promise}
     */
    UI.prototype.setPointerPropagationMode = function (mode) {
        return _ui.setPointerPropagationMode(this.pointerPropagationMode[mode]);
    };

    /**
     * Installs the given list of pointer event policies into Photoshop
     *
     * @params {Object.{policyList: Array.<Object>}} An Object containing a list of policies
     */
    UI.prototype.setPointerEventPropagationPolicy = _playground.ps.ui.setPointerEventPropagationPolicy;

    /**
     * Installs the given list of keyboard event policies into Photoshop
     *
     * @params {Object.{policyList: Array.<Object>}} An Object containing a list of policies
     */
    UI.prototype.setKeyboardEventPropagationPolicy = _playground.ps.ui.setKeyboardEventPropagationPolicy;



    /** @type {UI} The UI singleton */
    var theUI = new UI();

    module.exports = theUI;
});
