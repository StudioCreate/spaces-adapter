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
        util = require("./util"),
        Promise = require("bluebird");

    /**
     * Promisifyable versions of low-level _playground.ps.identity functions
     *
     * @private
     */
    var _identityDesc = function (desc, cb) {
        _playground._debug.descriptorIdentity(desc, null, function (err, odesc) { cb(err, odesc); });
    };

    var _identityRef = function (ref, cb) {
        _playground._debug.descriptorIdentity(null, ref, function (err, _, oref) { cb(err, oref); });
    };
    
    var _identityString = function (string, cb) {
        var nullInput = (typeof string !== "string" || string.length === 0),
            ref = nullInput ? null : { ref: string };
        
        _playground._debug.descriptorIdentity(null, ref, function (err, _, oref) {
            cb(err, oref ? oref.ref : null);
        });
    };

    /**
     * Promisified versions of low-level _playground.ps.descriptor functions
     *
     * @private
     */
    var _descriptor = {
        get: Promise.promisify(_playground.ps.descriptor.get),
        play: Promise.promisify(_playground.ps.descriptor.play),
        batchPlay: Promise.promisify(_playground.ps.descriptor.batchPlay),
        loopbackDescriptor: Promise.promisify(_identityDesc),
        loopbackReference: Promise.promisify(_identityRef),
        loopbackString: Promise.promisify(_identityString)
    };

    /**
     * The Adapter object provides helper methods for dealing with the
     * low-level native binding to Photoshop. This object will typically
     * not be used by user-level code.
     *
     * Emits low-level "4 character" Photoshop events such as "slct" with
     * the following parameters:
     *    1. @param {?} info about the event, dependent on event type (Note:
     *           this should become more specific as the native interface is
     *           further defined.)
     *
     * @extends EventEmitter
     * @constructor
     * @private
     */
    var Adapter = function () {
        EventEmitter.call(this);
    };
    util.inherits(Adapter, EventEmitter);

    /**
     * Event handler for events from the native bridge.
     *
     * @private
     * @param {*=} err Error information
     * @param {String} eventID typeID for event type
     * @param {Object} payload serialized ActionDescriptor for the event, dependent on event type
     */
    Adapter.prototype._psEventHandler = function (err, eventID, payload) {
        this.log("[Adapter] low-level event: " + eventID + "\n" + JSON.stringify(payload, null, "  "));

        this.emitEvent("all", [eventID, payload]);
        this.emitEvent(eventID, [eventID, payload]);
    };

    /**
     * Executes a low-level "get" call using an ActionReference.
     *
     * @param {(string|Array.<(string|Object)>|Object)} reference The reference to retrieve. Can be:
     *     - string of a class name
     *     - Object representation of ActionReference key/value pairs
     *     - An array of a combination of the above, which will get turned into the appropriate ActionReference
     * @return {Promise.<?>} The value of the reference, dependent on reference type
     */
    Adapter.prototype.get = function (reference) {
        this.log("[Adapter] execute get" + "\n" + JSON.stringify(reference, null, "  "));

        var wrap = function (toWrap) {
            if (Array.isArray(toWrap)) {
                return {ref: toWrap.map(wrap).reverse()};
            } else if (typeof toWrap === "string") {
                return {ref: toWrap, enum: "$Ordn", value: "$Trgt"};
            } else {
                return toWrap;
            }
        };

        return _descriptor.get(wrap(reference));
    };

    /**
     * Retrieves a property of a reference
     *
     * @param {String} reference The name of the reference
     * @param {String} property The name of the property
     * @return {Promise.<?>} The value of the property, dependent on reference type
     */
    Adapter.prototype.getProperty = function (reference, property) {
        this.log("[Adapter] execute getProperty " + reference + " : " + property);

        return this.get([reference, {ref: "$Prpr", property: property}])
            .then(function (obj) { return obj[property];});
    };

    /**
     * Executes a low-level "play" call on the specified ActionDescriptor.
     *
     * @param {string} command Name of the ActionDescriptor command
     * @param {Object=} params JS Object representation of ActionDescriptor key/value pairs, defaults to {}
     * @param {Object=} options options, defaults to "silent"
     * @return {Promise.<object>} Resolves when the call is complete (Note: eventually, this will
     *     return the value resulting from the execution of the ActionDescriptor, if any).
     */
    Adapter.prototype.call = function (command, params, options) {
        this.log("[Adapter] execute call " + command + "\n" + JSON.stringify(params, null, "  "));

        params = params || {};
        options = options || { interactionMode: _playground.ps.descriptor.interactionMode.SILENT };

        return _descriptor.play(command, params, options);
    };

    /**
     * Executes a low-level "batchPlay" call on the specified ActionDescriptors.
     *
     * @param {Array.<{eventId: string, arguments: object}>} descriptors Array of ActionDescriptors to play
     * @param {{continueOnError: boolean=}}=} batchOptions Options that control how the batch of
     *      ActionDescriptors is executed.
     * @param {object=} options Options applied to the execution of each ActionDescriptor individually
     * @return {Promise.<Array.object>} Resolves with the list of ActionDescriptor results. 
     */
    Adapter.prototype.batchCall = function (descriptors, batchOptions, options) {
        batchOptions = batchOptions || {};
        options = options || { interactionMode: _playground.ps.descriptor.interactionMode.SILENT };

        return _descriptor.batchPlay(descriptors, options, batchOptions);
    };

    /**
     * Executes a low-level "identity" call on the specified ActionDescriptor.
     *  Used to verify notation by parsing to ActionDescriptor and then serializing back to JS Object representation
     *
     * @param {Object=} params JS Object representation of ActionDescriptor key/value pairs.
     * @return {Promise.<Object>} The JS Object representation of the input ActionDescriptor
     */

    Adapter.prototype.loopbackDescriptor = _descriptor.loopbackDescriptor;

    /**
     * Executes a low-level "identity" call on the specified ActionReference.
     *  Used to verify notation by parsing to ActionReference and then serializing back to JS Object representation
     *
     * @param {Object=} params JS Object representation of ActionReference key/value pairs.
     * @return {Promise.<Object>} The JS Object representation of the input ActionReference
     */
    Adapter.prototype.loopbackReference = _descriptor.loopbackReference;

    /**
     * Executes a low-level "identity" call on the specified Action Descriptor ID.
     *
     * @param {String=} Runtime ID string (e.g: "name")  or $-prefixed OSType ID (e.g: "$Nm  ")
     * @return {Promise.<String>} The Runtime ID string for the given ID, if available.
     */
    Adapter.prototype.loopbackString = _descriptor.loopbackString;

    /**
     * Logs a string to Photoshop's ScriptListener output.
     *
     * Note: when the ScriptListener output goes away, this command will change to log to
     * Photoshop's stdout.
     *
     * @param {string} s The string to log (does NOT support string formatting like console.log).
     */
    Adapter.prototype.log = function (s) {
        _playground._debug.logMessage("----\n[" + (new Date()).toTimeString() + "] " + s + "\n----");
    };

    /** @type {Adapter} The Adapter singleton */
    var theAdapter = new Adapter();

    // bind native phtooshop event handler to our handler function
    _playground.ps.descriptor.registerEventListener(theAdapter._psEventHandler.bind(theAdapter));

    // register for events we care about
    // TODO: Eventually, we'll want to do this when clients call "on"/"once"
    _playground.ps.descriptor.addEvent("select", function (resultValue) { });
    
    module.exports = theAdapter;

});
