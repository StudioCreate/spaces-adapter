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

define(function (require, exports) {
    "use strict";
    
    var PlayObject = require("../playObject"),
        unitLib = require("adapter/lib/unit");

    /**
     * common  obejcts used in PS references 
     *
     * @private
     *
     * @type {Object.<string, string>} 
     */
    var _layerRef = {
            "_ref": "layer",
            "_enum": "ordinal",
            "_value": "targetEnum" },
        _vectorMaskRef = {
            "_ref": "path",
            "_enum": "path",
            "_value": "vectorMask" },
        _pathRef = {
            "_ref": "path",
            "_enum": "ordinal",
            "_value": "targetEnum" };

    /**
     * creates a rectangular work path with the given bounds descriptor 
     *
     * below each unit is a object of type {_value: number, _unit: type}
     * @param {{top: unit, bottom: unit, left: unit, right: unit}} bounds the bounds object 
     * @return {PlayObject}
     */
    var makeBoundsWorkPath = function (bounds) {
        return new PlayObject("set", {
            "null": {
                "_ref": [{
                    "_ref": "path",
                    "_property": "workPath"
                }]
            },
            "to": {
                "_obj": "rectangle",
                "_value": bounds
            }
        });
    };

    /**
     * creates a ciruclar work path with the given bounds descriptor 
     *
     * below each unit is a object of type {_value: number, _unit: type}
     * @param {{top: unit, bottom: unit, left: unit, right: unit}} bounds the bounds object 
     * @return {PlayObject}
     */
    var makeCircularBoundsWorkPath = function (bounds) {
        var cenX = (bounds.left + bounds.right) / 2,
            cenY = (bounds.top + bounds.bottom) / 2,
            radius = Math.max(bounds.top - cenY, bounds.right - cenX),
            circleTop = unitLib.pixels(cenY - radius),
            circleLeft = unitLib.pixels(cenX - radius),
            circleRight = unitLib.pixels(cenX + radius),
            circleBottom = unitLib.pixels(cenY + radius),
            circleBounds = {
                "unitValueQuadVersion": 1,
                "top": circleTop,
                "left": circleLeft,
                "bottom": circleBottom,
                "right": circleRight
            };

        return new PlayObject("set", {
            "null": {
                "_ref": [{
                    "_ref": "path",
                    "_property": "workPath"
                }]
            },
            "to": {
                "_obj": "ellipse",
                "_value": circleBounds
            }
        });
    };
    /**
     * creates a ciruclar work path with the given bounds descriptor 
     *
     * below each unit is a object of type {_value: number, _unit: type}
     * @param {{top: unit, bottom: unit, left: unit, right: unit}} bounds the bounds object 
     * @return {PlayObject}
     */
    var makeCircularBoundsVectorMaskPath = function (bounds) {
        var cenX = (bounds.left + bounds.right) / 2,
            cenY = (bounds.top + bounds.bottom) / 2,
            radius = Math.min(bounds.top - cenY, bounds.right - cenX),
            circleTop = unitLib.pixels(cenY - radius),
            circleLeft = unitLib.pixels(cenX - radius),
            circleRight = unitLib.pixels(cenX + radius),
            circleBottom = unitLib.pixels(cenY + radius),
            circleBounds = {
                "unitValueQuadVersion": 1,
                "top": circleTop,
                "left": circleLeft,
                "bottom": circleBottom,
                "right": circleRight
            };

        return new PlayObject("set", {
            "null": {
                "_ref": [_vectorMaskRef, _layerRef]
            },
            "to": {
                "_obj": "ellipse",
                "_value": circleBounds
            }
        });
    };
    /**
     * Turn the workpath into a vector mask for the current layer
     * 
     * @return {PlayObject}
     */
    var makeVectorMaskFromWorkPath = function () {
        var maskRef = {
            "_ref": [_vectorMaskRef]
        },
            pathRef = {
                "_ref": [_pathRef]
            };

        return new PlayObject("make", {
            "null": {
                "_ref": [{
                    "_ref": "path"
                }
            ] },
            "at": maskRef,
            "using": pathRef
        });
    };

    /**
     * Delete the current work path
     * 
     * @return {PlayObject}
     */
    var deleteWorkPath = function () {
        return new PlayObject("delete", {
            "null": {
                "_ref": [{
                    "_ref": "path",
                    "_property": "workPath"
                }]
            }
        });
    };


    /**
     * Delete the current vector mask on the current layer
     * 
     * @return {PlayObject}
     */
    var deleteVectorMask = function () {
        return new PlayObject("delete", {
            "null": {
                "_ref": [_vectorMaskRef, _layerRef]
            }
        });
    };

    /**
     * Target the vector mask of the current layer
     * 
     * @return {PlayObject}
     */
    var selectVectorMask = function () {
        return new PlayObject("select", {
            "null": {
                "_ref": [_vectorMaskRef, _layerRef]
            }
        });
    };

    /**
     * activate the knots of the targeted vector mask
     * 
     * @return {PlayObject}
     */
    var activateVectorMaskEditing = function () {
        return new PlayObject("activateVectorMaskEditing", {
            "null": {
                "_ref": [_layerRef]
            }
        });
    };
    

    /**
     * drops the selection on the current path
     * 
     * @return {PlayObject}
     */
    var dropPathSelection = function () {
        return new PlayObject("deselect", {
            "null": {
                "_ref": [_pathRef]
            }
        });
    };

    /**
     * free transform the whole path of the targeted vector mask
     * 
     * @return {PlayObject}
     */
    var enterFreeTransformPathMode = function () {
        var propertyRef = {
                _ref: "property",
                _property: "freeTransformWholePath"
            };
        
        return new PlayObject("set", {
            "null": {
                "_ref": [propertyRef, _layerRef]
            },
            "_property": "freeTransformWholePath",
            "suppressPlayLevelIncrease": true
        });
    };
    /**
     * create a reveal all vector mask on current layer
     * 
     * @return {PlayObject}
     */
    var createRevealAllMask = function () {
        var desc = {
            "null": {
                "_ref": [{
                    "_ref": "path"
                }]
            },
            "at": {
                "_ref": [_vectorMaskRef]
            },
            "using": {
                "_enum": "vectorMaskEnabled",
                "_value": "revealAll"
            }
        };
        return new PlayObject("make", desc);
    };

    exports.createRevealAllMask = createRevealAllMask;
    exports.enterFreeTransformPathMode = enterFreeTransformPathMode;
    exports.activateVectorMaskEditing = activateVectorMaskEditing;
    exports.dropPathSelection = dropPathSelection;
    exports.makeBoundsWorkPath = makeBoundsWorkPath;
    exports.selectVectorMask = selectVectorMask;
    exports.deleteWorkPath = deleteWorkPath;
    exports.deleteVectorMask = deleteVectorMask;
    exports.makeVectorMaskFromWorkPath = makeVectorMaskFromWorkPath;
    exports.makeCircularBoundsWorkPath = makeCircularBoundsWorkPath;
    exports.makeCircularBoundsVectorMaskPath = makeCircularBoundsVectorMaskPath;
});
