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

/* global _spaces */

import Promise from "bluebird";
import _ from "lodash";

import NotifierProxy from "../util/notifierproxy";

/** 
 * Wraps certain type of parameters making it easier to call Descriptor.prototype.get
 * For arrays, returns the reference to array recursively mapping everything inside
 * For string values, references to the currently active one
 * For objects, leaves them as is.
 * 
 * @private
 * @param {(string|Array.<object>|object)} reference object to reference to
 * @param {Array.<string>=} multiGetProperties For multiGet references, the
 *  list of properties to include in the wrapped reference.
 * @return {object} Reference to the toWrap object in a form .get will accept
 */
const _wrap = function (reference, multiGetProperties) {
    if (Array.isArray(reference)) {
        reference = _(_.cloneDeep(reference))
            .map(function (ref) {
                return _wrap(ref);
            })
            .reverse()
            .value();
    } else if (typeof reference === "string") {
        reference = {
            _ref: reference,
            _enum: "ordinal",
            _value: "targetEnum"
        };
    } else if (reference.hasOwnProperty("null")) {
        // Special case for play objects
        reference["null"] = _wrap(reference["null"]);
    }

    if (multiGetProperties) {
        reference = {
            _multiGetRef: [{
                _propertyList: multiGetProperties
            }].concat(reference)
        };
    } else if (Array.isArray(reference)) {
        reference = {
            _ref: reference
        };
    }

    return reference;
};

/**
 * Constructs a property reference from the given action reference and
 * property name.
 *
 * @private
 * @param {(string|Array.<object>|object)} reference
 * @param {string} property
 * @return {Array.<object>}
 */
const _makePropertyReference = function (reference, property) {
    const propertyDescriptor = {
        _ref: "property",
        _property: property
    };

    return Array.isArray(reference) ?
            reference.concat(propertyDescriptor) :
            [reference, propertyDescriptor];
};

/**
 * The Descriptor object provides helper methods for dealing with the
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
export class Descriptor extends NotifierProxy {
    /**
     * @param {object=} options
     * @param {Array.<string|{event: string, universal: boolean}>=} options.events
     */
    constructor (options) {
        super(_spaces.notifierGroup.PHOTOSHOP, options);

        /**
         * Transaction ID counter
         * @private
         * @type {number}
         */
        this._transactionIDCounter = 0;

        /**
         * Map of active transactions by transaction ID
         * @private
         * @type {Map.<number, {commands: Array.<object>, options: object}>}
         */
        this._transactions = new Map();

        /**
         * Low-level promisified batchPlay function.
         * @private
         * @type {function():Promise}
         */
        this._batchPlayAsync = Promise.promisify(_spaces.ps.descriptor.batchPlay, {
            context: _spaces.ps.descriptor,
            multiArgs: true
        });
        
        /**
         * Low-level promisified get function.
         * @private
         * @type {function():Promise}
         */
        this._getAsync = Promise.promisify(_spaces.ps.descriptor.get, {
            context: _spaces.ps.descriptor
        });
    }

    /**
     * Defines an enumeration of three constants that control dialog display
     * while executing action descriptors: DONT_DISPLAY, DISPLAY and SILENT.
     * 
     * @const
     * @type {Object.<string, number>}
     */

    static get interactionMode () { return _spaces.ps.descriptor.interactionMode; }

    /**
     * Executes a low-level "get" call using an ActionReference.
     *
     * @param {(string|Array.<(string|Object)>|Object)} reference The reference to retrieve. Can be:
     *     - string of a class name
     *     - Object representation of ActionReference key/value pairs
     *     - An array of a combination of the above, which will get turned into the appropriate ActionReference
     * @param {object=} options
     * @return {Promise.<?>} The value of the reference, dependent on reference type
     */
    get (reference, options) {
        if (options === undefined) {
            options = {};
        }

        const wrappedReference = _wrap(reference);

        return this._getAsync(wrappedReference, options);
    }

    /**
     * Retrieves a property of a reference
     *
     * @param {string} reference The name of the reference
     * @param {string} property The name of the property
     * @param {object=} options
     * @return {Promise.<?>} The value of the property, dependent on reference type
     */
    getProperty (reference, property, options) {
        const propertyReference = _makePropertyReference(reference, property);

        return this.get(propertyReference, options)
            .then(function (obj) {
                if (!obj || !obj.hasOwnProperty(property)) {
                    throw new Error("No such property: " + property);
                }

                return obj[property];
            });
    }

    /**
     * Executes a "set" call on the given property of the reference to set to value.
     *
     * @param {object} reference A full reference object, possibly created by lib/reference.js wrappers
     * @param {string} property Property name to edit
     * @param {object|string} value Desired new value of the property
     * @param {Object=} options options, defaults to "silent"
     * @return {Promise.<object>} Resolves when property is set
     */
    setProperty (reference, property, value, options) {
        if (!reference.hasOwnProperty("_ref")) {
            throw new Error("You must pass a full reference to setProperty or else PS will crash!");
        }

        // We need to reverse this because for play calls _makePropertyReference orders it wrong
        const propertyReference = _makePropertyReference(reference, property).reverse(),
            propertyValue = {
                "_obj": property,
                "_value": value
            },
            propertyDescriptor = {
                "null": { "_ref": propertyReference },
                "to": propertyValue
            };

        return this.play("set", propertyDescriptor, options);
    }

    /**
     * Get a list of properties on a continguous range of references, (e.g.,
     * layers at a contiguous range of layer indices).
     * 
     * @param {object} reference
     * @param {{range: string, index: number=, count: number=}} rangeOpts By default,
     *  count is -1, which indicates that the rest of the range should be fetched, and
     *  index is 1.
     * @param {Array.<string>} properties
     * @param {object=} options
     * @return {Promise.<Array.<Object.<string, *>>>}
     */
    getPropertiesRange (reference, rangeOpts, properties, options) {
        const range = rangeOpts.range;
        const index = rangeOpts.hasOwnProperty("index") ? rangeOpts.index : 1;
        const count = rangeOpts.hasOwnProperty("count") ? rangeOpts.count : -1;

        if (options === undefined) {
            options = {};
        }

        const multiRef = {
            _multiGetRef: [
                {
                    _propertyList: properties
                },
                {
                    _range: range,
                    _index: index,
                    _count: count
                },
                reference
            ]
        };

        return this._getAsync(multiRef, options).get("list");
    }

    /**
     * Get a single property on a continguous range of references, (e.g.,
     * layers at a contiguous range of layer indices).
     * 
     * @see Descriptor.prototype.getPropertiesRange
     * @param {object} reference
     * @param {{range: string, index: number=, count: number=}} rangeOpts
     * @param {string} property
     * @param {object=} options
     * @return {Promise.<Array.<*>>}
     */
    getPropertyRange (reference, rangeOpts, property, options) {
        return this.getPropertiesRange(reference, rangeOpts, [property], options)
            .then(function (results) {
                return _.map(results, property);
            });
    }

    /**
     * Executes a low-level "play" call on the specified ActionDescriptor.
     * 
     * NOTE: play is now implemented internally with batchPlay, which has
     * additional options for describing history states.
     *
     * @param {string} name Name of the ActionDescriptor command
     * @param {object=} descriptor JS Object representation of ActionDescriptor key/value pairs, defaults to {}
     * @param {object=} options options, defaults to "silent"
     * @return {Promise.<object>} Resolves when the call is complete (Note: eventually, this will
     *     return the value resulting from the execution of the ActionDescriptor, if any).
     */
    play (name, descriptor, options) {
        const commands = [{
            name: name,
            descriptor: descriptor || {}
        }];

        return this.batchPlay(commands, options).get(0);
    }

    /**
     * Executes a low-level "play" call on the PlayObject by unwrapping it
     *
     * @param {PlayObject} playObject Contains command, descriptor and options information
     * @param {object=} options Overrides any options in the playObject
     * @returns {Promise} Resolves to the result of the call
     */
    playObject (playObject, options) {
        return this.batchPlayObjects([playObject], options).get(0);
    }

    /**
     * Executes a low-level "batchPlay" call on the given commands immediately
     * skipping transaction collection
     *
     * @param {Array.<{name: string, descriptor: object, options: object=}>} commands Array of 
     *  ActionDescriptors to play
     * @param {{continueOnError: boolean=}=} options Options applied to the execution of the batchPlay
     * @return {Promise.<Array.<object>>} Resolves with the list of ActionDescriptor results, or rejects
     *      with either an adapter error, or a single command error if not continueOnError mode. In
     *      continueOnError mode, always resolve with both the results and errors arrays.
     */
    _batchPlayImmediate (commands, options) {
        if (!options.hasOwnProperty("interactionMode")) {
            options.interactionMode = Descriptor.interactionMode.SILENT;
        }

        return this._batchPlayAsync(commands, options)
            .then(function (response) {
                // Never reject in continueOnError mode; the caller must always check the results
                if (options.continueOnError) {
                    return response;
                }

                var theError;
                response[1].some(function (error) {
                    if (error) {
                        theError = error;
                        return true;
                    }
                });

                if (theError) {
                    // otherwise, throw the first error, because there is only one
                    throw theError;
                }
                
                // if there are no errors, resolve with just the results
                return response[0];
            });
    }

    /**
     * Adds the given commands with the options to the given existing transaction
     * If any of the options already exist in the transactionOptions (txOptions)
     * it will not throw
     *
     * @private
     * @param {number} tid Transaction ID, must have been started with beginTransaction
     * @param {Array.<{name: string, descriptor: object, options: object=}>} commands Array of 
     *  ActionDescriptors to play
     * @param {{continueOnError: boolean=}=} options Options applied to the execution of the batchPlay
     * @return {Promise.<Array>} An empty array with the expected length for selection dance
     * to function correctly
     */
    _addToTransaction (tid, commands, options) {
        var transactionInfo = this._transactions.get(tid);
        if (!transactionInfo) {
            throw new Error("Invalid transaction ID: " + tid);
        }

        // If any of the batchPlay calls in the transaction disagree on some options
        // and those options are not defined in the beginTransaction function's options
        // we will throw an error
        // 
        // We still accept the existing options, but at the endTransaction method, whatever is
        // in txOptions is the final truth. For example, most of the time, historyStateInfo
        // will disagree between batchPlay options, so it needs to be declared at beginTransaction level
        var txOptions = transactionInfo.txOptions,
            nextOptions = _.merge(transactionInfo.options, options, function (a, b, key) {
                if (a === undefined) {
                    return b;
                } else if (b === undefined) {
                    return a;
                } else if (!txOptions.hasOwnProperty(key) && !_.isEqual(a, b)) {
                    throw new Error("Incompatible options in transaction.");
                } else {
                    return a;
                }
            });

        transactionInfo.options = nextOptions;
        transactionInfo.commands = transactionInfo.commands.concat(commands);

        return Promise.resolve(new Array(commands.length));
    }

    /**
     * Initiates a transaction, saving all batchPlay calls being added to this transaction
     * from being played until @see endTransaction is called
     *
     * @param {{historyStateInfo: object}=} options contains a single history state information for this
     * transaction to apply
     * @return {number} Initiated transaction ID
     */
    beginTransaction (options) {
        var transactionID = this._transactionIDCounter++,
            transactionInfo = {
                txOptions: options || {},
                options: {},
                commands: []
            };

        this._transactions.set(transactionID, transactionInfo);

        return transactionID;
    }

    /**
     * Finalizes a transaction, playing all accumulated batchPlay objects
     * under the same history state
     *
     * @param {number} tid Transaction ID
     * @return {Promise.<Array.<object>>} Resolves with the list of ActionDescriptor results, or rejects
     *      with either an adapter error, or a single command error if not continueOnError mode. In
     *      continueOnError mode, always resolve with both the results and errors arrays.
     */
    endTransaction (tid) {
        var transactionInfo = this._transactions.get(tid);
        if (!transactionInfo) {
            throw new Error("Invalid transaction ID: " + tid);
        }

        var finalOptions = _.merge(transactionInfo.options, transactionInfo.txOptions);

        return this._batchPlayImmediate(transactionInfo.commands, finalOptions)
            .bind(this)
            .tap(function () {
                this._transactions.delete(tid);
            });
    }

    /**
     * Executes a low-level "batchPlay" call on the specified ActionDescriptors.
     *
     * @param {Array.<{name: string, descriptor: object, options: object=}>} commands Array of 
     *  ActionDescriptors to play
     * @param {object=} options Options applied to the execution of the batchPlay
     * @param {boolean=} options.continueOnError If true, will not stop playing all commands
     * @param {number=} options.transaction If provided, will save the commands into the transaction
     * @return {Promise.<Array.<object>>} Resolves with the list of ActionDescriptor results, or rejects
     *      with either an adapter error, or a single command error if not continueOnError mode. In
     *      continueOnError mode, always resolve with both the results and errors arrays.
     */
    batchPlay (commands, options) {
        options = options || {};

        if (commands.length === 0) {
            // If options.continueOnError is true, returns an array that contains two empty arrays: the first
            // array represents empty result, the second represents empty error.
            // If false, return an empty array as result.
            return Promise.resolve(options.continueOnError ? [[], []] : []);
        }

        if (options.hasOwnProperty("transaction")) {
            return this._addToTransaction(options.transaction, commands, options);
        } else {
            return this._batchPlayImmediate(commands, options);
        }
    }

    /**
     * Executes a low-level "batchPlay" call on the specified PlayObjects.
     *
     * @param {Array.<PlayObject>} objects Array of PlayObjects to play
     * @param {{continueOnError: boolean=}=} options Options applied to the execution of the batchPlay
     * @return {Promise.<Array.<object>>} Resolves with the list of ActionDescriptor results. 
     */
    batchPlayObjects (objects, options) {
        var commands = objects.map(function (object) {
            var command = {
                name: object.command,
                descriptor: _wrap(object.descriptor)
            };

            if (object.hasOwnProperty("options")) {
                command.options = object.options;
            }

            return command;
        });

        return this.batchPlay(commands, options);
    }

    /**
     * Executes a sequence of low-level "get" calls using batchPlay.
     *
     * NOTE: batchGet is currently slightly slower than simply executing the
     * get calls independently, which is almost certainly an adapter bug.
     * If that bug isn't fixed, we should consider replacing the implementation
     * of this method with one that simply performs the gets independently.
     *
     * @see Descriptor.prototype.get
     * @see Descriptor.prototype.batchPlay
     * @param {Array.<object>} references The references to retrieve.
     * @param {object=} options
     * @return {Promise.<Array.<object>>} Resolves with an array of results.
     */
    batchGet (references, options) {
        var commands = references.map(function (reference) {
            return {
                name: "get",
                descriptor: {
                    "null": _wrap(reference)
                }
            };
        });

        return this.batchPlay(commands, options);
    }

    /**
     * Executes a sequence of low-level "getProperty" calls using batchPlay.
     *
     * @see Descriptor.prototype.get
     * @see Descriptor.prototype.batchPlay
     * @param {Array.<{reference: object, property: string}>} refObjs
     *      The references and properties to retrieve.
     * @param {object=} options
     * @return {Promise.<Array.<object>>} Resolves with an array of property results.
     */
    batchGetProperties (refObjs, options) {
        options = options || {};

        var propertyReferences = refObjs.map(function (refObj) {
            return _makePropertyReference(refObj.reference, refObj.property);
        });

        return this.batchGet(propertyReferences, options)
            .then(function (response) {
                if (options.continueOnError) {
                    return response;
                }

                return response.map(function (result, index) {
                    var property = refObjs[index].property;
                    if (!result || !result.hasOwnProperty(property)) {
                        throw new Error("No such property: " + property);
                    }

                    return result[property];
                });
            });
    }

    /**
     * Fetch optional properties, which might not exist, and ignore errors.
     * 
     * @param {object} reference
     * @param {Array.<string>} properties
     * @return {Promise.<object>} Always resolves to an object, but keys that
     *  don't exist are omitted from the resolved value.
     */
    batchGetOptionalProperties (reference, properties) {
        var makeRefObj = function (property) {
            return {
                reference: reference,
                property: property
            };
        };

        var refObjs = properties.map(makeRefObj),
            options = {
                continueOnError: true
            };

        return this.batchGetProperties(refObjs, options)
            .then(function (results) {
                var values = results[0];

                return values.reduce(function (result, value, index) {
                    var property = properties[index];
                    if (value && value.hasOwnProperty(property)) {
                        result[property] = value[property];
                    }
                    return result;
                }, {});
            });
    }

    /**
     * Executes a sequence of low-level "getProperty" calls for a single property
     * using batchPlay.
     *
     * @see Descriptor.prototype.get
     * @see Descriptor.prototype.batchPlay
     * @param {object} references The references to retrieve
     * @param {string} property The property to retrieve
     * @param {object=} options
     * @return {Promise.<Array.<object>>} Resolves with an array of property results.
     */
    batchGetProperty (references, property, options) {
        var refObjs = references.map(function (reference) {
            return {
                reference: reference,
                property: property
            };
        });

        return this.batchGetProperties(refObjs, options);
    }

    /**
     * Efficiently get a set of properties on an arbitrary set of references.
     * 
     * @param {Array.<object|string|Array.<object>>} references
     * @param {Array.<string>} properties
     * @param {object=} options Use continueOnError to allow some properties to
     *  not be returned
     * @return {Promise.<Array.<Object.<string, *>>>}
     */
    batchMultiGetProperties (references, properties, options) {
        if (properties.length === 0) {
            return Promise.resolve([{}]);
        }

        if (options === undefined) {
            options = {};
        }

        var multiGetOptions = {
            useMultiGet: true,
            failOnMissingProperty: !options.continueOnError
        };

        var commands = references.map(function (reference) {
            var descriptor = {
                null: _wrap(reference, properties)
            };

            return {
                name: "get",
                descriptor: descriptor,
                options: multiGetOptions
            };
        });

        return this.batchPlay(commands, options)
            .then(function (response) {
                if (options.continueOnError) {
                    return response[0];
                } else {
                    return response;
                }
            });
    }

    /**
     * Efficiently get a set of properties on a single reference. Not all
     * properties need be present.
     * 
     * @param {object|string|Array.<object>} reference
     * @param {Array.<string>} properties
     * @param {object=} options Use continueOnError to allow some properties to
     *  not be returned
     * @return {Promise.<Object.<string, *>>}
     */
    multiGetOptionalProperties (reference, properties, options) {
        if (properties.length === 0) {
            return Promise.resolve({});
        }

        if (options === undefined) {
            options = {};
        }

        return this._getAsync(_wrap(reference, properties), options);
    }

    /**
     * Effeciently get a set of properties on a single reference.
     * 
     * @param {object|string|Array.<object>} reference
     * @param {Array.<string>} properties
     * @param {object=} options Use continueOnError to allow some properties to
     *  not be returned
     * @return {Promise.<Object.<string, *>>}
     */
    multiGetProperties (reference, properties, options) {
        if (options === undefined) {
            options = {};
        }

        // FIXME: This following option doesn't work when properties ===
        // ["targetLayers"], which is why the .tap below is needed.
        // See Watson 4010314 for details.
        options.failOnMissingProperty = true;

        return this.multiGetOptionalProperties(reference, properties, options)
            .tap(function (obj) {
                properties.forEach(function (property) {
                    if (!obj.hasOwnProperty(property)) {
                        throw new Error("No such property: " + property);
                    }
                });
            });
    }
}

/**
 * Construct a Descriptor object with the given options.
 *
 * @param {object=} options
 * @param {?Array.<string|{event: string, universal: boolean}>=} options.events Null to allow all events.
 * @return {Descriptor}
 */
export function makeDescriptor (options = {}) {
    let descriptor = new Descriptor(options);

    descriptor.unpause();

    return descriptor;
}
