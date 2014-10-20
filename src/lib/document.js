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

    var PlayObject = require("../playobject"),
        referenceBy = require("./reference").wrapper("document"),
        unitsIn = require("./unit");

    var assert = require("../util").assert,
        referenceOf = require("./reference").refersTo;

    /**
     * Open a document (psd, png, jpg, ai, gif)
     * 
     * @param {ActionDescriptor} sourceRef document reference
     * @param {string} settings.pdfSelection "page" or "image"
     * @param {number} settings.pageNumber The number of the page
     * @param {boolean} settings.suppressWarnings true or false
     * @param {string} settings.name The name of the Document.
     * @param {number} settings.bitDepth The bit depth. 8 or 16
     * @param {string} settings.box Box to crop to. See openDocument.cropTo vals 
     * @param {boolean} settings.bAntiAlias true or false
     * @param {boolean} settings.bConstrainProportions true or false
     * @param {number} settings.width The width of the image size.
     * @param {number} settings.height The height of the image size
     * @param {string} settings.colorSpace The color space of the image mode.  See openDocument.mode vals
     * @param {number} settings.resolution The resolution value
     *
     * @return {PlayObject}
     *
     */
    var openDocument = function (sourceRef, settings) {
        var params = {
                pdfSelection:       settings.pdfSelection || "page",
                pageNumber:         settings.pageNumber || 1,
                suppressWarnings:   settings.suppressWarnings || false,
                name:               settings.name || sourceRef.name,
                bitDepth:           settings.bitDepth || 8,
                box:                settings.box || "boundingBox",
                bAntiAlias:         settings.bAntiAlias || true,
                bConstrainProportions:      settings.bConstrainProportions || true,
                width:              settings.width || sourceRef.width,
                height:             settings.height || sourceRef.height,
                colorSpace:         settings.colorSpace || "RGBColor",
                resolution:         settings.resolution
            },
            fileType,
            strIndex = sourceRef.path.lastIndexOf(".");
        if (strIndex !== -1) {
            strIndex++;
            fileType = sourceRef.path.substring(strIndex);
        }
        var desc = {
            "null": sourceRef
        };
        if (fileType === "ai") {
            desc.as.obj = "PDFGenericFormat";
            desc.as.value.selection = {
                "enum": "pdfSelection",
                "value": params.pdfSelection
            };
            desc.as.value.suppressWarnings = params.suppressWarnings;
            desc.as.value.pageNumber = params.pageNumber;
            if (params.pdfSelection === "page") {
                desc.as.value =  {
                    "antiAlias": params.bAntiAlias,
                    "constrainProportions": params.bConstrainProportions,
                    "crop": {
                        "enum": "cropTo",
                        "value": openDocument.cropTo[params.box]
                    },
                    "depth": params.bitDepth,
                    "width": unitsIn.pixels(params.width),
                    "height": unitsIn.pixels(params.height),
                    "mode": {
                        "enum": "colorSpace",
                        "value": openDocument.mode[params.colorSpace]
                    },
                    "name": params.name,
                    "resolution": unitsIn.density(params.resolution)
                };
            }
        }
        return new PlayObject(
            "open",
            desc
        );
    };
    openDocument.cropTo = {
        bounding: "boundingBox",
        media: "mediaBox",
        crop: "cropBox",
        bleed: "bleedBox",
        trim: "trimBox",
        art: "artBox"
    };
    openDocument.mode = {
        rgb: "RGBColor",
        gray: "grayscaleMode",
        cmyk: "CMYKColorEnum",
        lab: "labColor"
    };

    /**
     * Close a document without saving
     * 
     * @param {string} save Whether the document should be saved. "yes", "no"
     *
     * @return {PlayObject}
     *
     * Preconditions:
     * The document should be saved previously and have fileReference path value for saving.
     */
    var closeDocument = function (save) {
        var desc = {
            "saving": {
                "enum": "yesNo",
                "value": save
            }
        };
        return new PlayObject(
            "close",
            desc
        );
    };

    /**
     * Save a document
     * 
     * @param {string} path The full path to save a file.
     * @param {!Object} settings An object with params
     * @param {string} settings.gifColorPalette GIF color palette. See saveDocument.gifColorPalette
     * @param {string} settings.gifForcedColors GIF forced color. See saveDocument.gifForcedColors
     * @param {boolean} settings.gitTransparency GIF Transparency
     * @param {string} settings.gifRowOrder GIF Format Option.  normal or interlaced
     * @param {number} settings.jpgExtendedQuality JPG Quality. 0 to 10
     * @param {string} settings.jpgFormatOptions JPG Format Option. standard, optimized, or progressive
     * @param {number} settings.jpgProgressiveScans The number of Scans. 3 to 5
     * @param {number} settings.pngCompression PNG compression. none or smallest
     * @param {number} settings.pngInterlace PNG interlace. none or interlaced

     * @param {boolean} settings.embedProfiles Whether embed color profile
     * 
     * @return {PlayObject}
     */
    var saveDocument = function (path, settings) {
        var strIndex = path.lastIndexOf("."),
            pathIndex = path.lastIndexOf("/"),
            fileType,
            fileName,
            filePath,
            desc,
            saveAs = {},
            saveTo = {},
            params = {
                gifColorPalette:     settings.gifColorPalette || "exact",
                gifRowOrder:         settings.gifRowOrder || "normal",
                gifForcedColors:     settings.gifForcedColors || "blackAndWhite",
                gitTransparency:     settings.gitTransparency || true,
                jpgExtendedQuality:  settings.jpgExtendedQuality || 8,
                jpgFormatOptions:    settings.jpgFormatOptions || "standard",
                jpgProgressiveScans: settings.jpgProgressiveScans || 3,
                pngCompression:      settings.pngCompression,
                pngInterlace:        settings.pngInterlace,
                embedProfiles:       settings.embedProfiles || false
            };
        if (strIndex !== -1) {
            strIndex++;
            fileType = path.substring(strIndex);
        }
        if (pathIndex !== -1) {
            pathIndex++;
            fileName = path.substring(pathIndex);
        }
        filePath = path.replace(fileName, "");

        if (fileType === "gif") {
            saveAs = {
                "obj": "GIFFormat",
                "value": {
                    "interfaceIconFrameDimmed": saveDocument.gifRowOrder[params.gifRowOrder]
                }
            };
            saveTo = {
                "obj": "indexedColorMode",
                "value": {
                    "palette": {
                        "enum": "colorPalette",
                        "value": saveDocument.gifColorPalette[params.gifColorPalette]
                    },
                    "forcedColors": {
                        "enum": "forcedColors",
                        "value": saveDocument.gifForcedColors[params.gifForcedColors]
                    },
                    "transparency": params.gitTransparency
                }
            };
        } else if (fileType === "psd") {
            saveAs = {
                "obj": "photoshop35Format",
                "value": {}
            };
        } else if (fileType === "jpg") {
            saveAs = {
                "obj": "JPEG",
                "value": {
                    "extendedQuality": params.jpgExtendedQuality,
                    "matteColor": {
                        "enum": "matteColor",
                        "value": "none"
                    }
                }
            };
        } else if (fileType === "png") {
            saveAs = {
                "obj": "PNGFormat",
                "value": {
                    "PNGInterlaceType": {
                        "enum": "PNGInterlaceType",
                        "value": saveDocument.pngInterlace[params.pngInterlace]
                    },
                    "compression": saveDocument.pngCompression[params.pngCompression]
                }
            };
        }
        desc = {
            "as": saveAs,
            "in": {
                "path": path
            }
        };
        if (fileType === "gif") {
            desc.to = saveTo;
            desc.copy = true;
        } else {
            desc.embedProfiles = params.embedProfiles;
        }
        return new PlayObject(
            "make",
            desc
        );
    };
    saveDocument.pngCompression = {
        none: 0,
        smallest: 9
    };
    saveDocument.pngInterlace = {
        none: "PNGInterlaceNone",
        interlaced: "PNGInterlaceAdam7"
    };
    saveDocument.gifColorPalette = {
        exact: "exact",
        mac: "macintoshSystem",
        window: "windowsSystem",
        web: "web",
        localPerceptual: "perceptual",
        localSelective: "selective",
        localAdaptive: "adaptive",
        previous: "previous"
    };
    saveDocument.gifRowOrder = {
        normal: false,
        interlaced: true
    };
    saveDocument.gifForcedColors = {
        none: "none",
        blackAndWhite: "blackAndWhite",
        primaries: "primaries",
        web: "web"
    };

    /**
     * Select a document
     * 
     * @param {ActionDescriptor} sourceRef document reference
     *
     * @return {PlayObject}
     *
     */
    var selectDocument = function (sourceRef) {
        assert(referenceOf(sourceRef) === "document", "selectDocument is passed a non-document reference");
        
        var desc = {
            "null": sourceRef
        };
        return new PlayObject(
            "select",
            desc
        );
    };

    /**
     * Return a document path to be used for opening or saving a document.
     * 
     * @param {string} path document path
     *
     * @return {PlayObject}
     *
     */
    referenceBy.path = function (path) {
        return {
            descriptor: {
                "null": path
            }
        };
    };

    /**
     * Create a document
     * 
     * @param {number} settings.width The document width.
     * @param {number} settings.height The document height.
     * @param {number} settings.resolution The document resolution.
     * @param {string} settings.fill The document fill. "white", "backgroundColor", "transparency"
     * @param {string} settings.colorMode The document color mode. "RGBColor", "bitmapMode", "grayscaleMode" 
                        "CMYKColorMode", "labColorMode"
     * @param {number} settings.depth The color mode depth
     * @param {string} settings.colorProfile The document color profile. "sRGB IEC61966-2.1", "Adobe RGB (1998)"
     * @param {string} settings.pixelAspectRatio The document pixel aspect ratio. 
     *
     * @return {PlayObject}
     *
     */
    var createDocument = function (settings) {
        var params = {
                width:      settings.width || 7,
                height:     settings.width || 5,
                resolution: settings.resolution || 72,
                fill:       settings.fill || "white",
                colorMode:  settings.colorMode || "RGBColor",
                depth:      settings.depth || 8,
                colorProfile:    settings.colorProfile || "sRGB IEC61966-2.1",
                pixelAspectRatio:  settings.pixelAspectRatio || 1
            };
        var newObj = {
            "obj": "document",
            "value": {
                "width": unitsIn.distance(params.width),
                "height": unitsIn.distance(params.height),
                "resolution": unitsIn.density(params.resolution),
                "fill": {
                    "enum": "fill",
                    "value": params.fill
                },
                "mode": {
                    "class": params.colorMode
                },
                "depth": params.depth,
                "profile": params.colorProfile,
                "pixelScaleFactor": params.pixelAspectRatio
            }
        };
        var desc = {
            "new": newObj
        };
        return new PlayObject(
            "make",
            desc
        );
    };

    var resizeDocument = function (width, height, extension) {
        var extension = extension || "center";

        return new PlayObject(
            "canvasSize",
            {
                "canvasExtensionColorType": {
                    "enum": "canvasExtensionColorType",
                    "value": "backgroundColor"
                },
                "height": {
                    "unit": "pixelsUnit",
                    "value": height
                },
                "horizontal": {
                    "enum": "horizontalLocation",
                    "value": extension
                },
                "vertical": {
                    "enum": "verticalLocation",
                    "value": extension
                },
                "width": {
                    "unit": "pixelsUnit",
                    "value": width
                }
            }
        );
    }

    exports.referenceBy = referenceBy;
    
    exports.open = openDocument;
    exports.close = closeDocument;
    exports.save = saveDocument;
    exports.select = selectDocument;
    exports.create = createDocument;
    exports.resize = resizeDocument;

});
