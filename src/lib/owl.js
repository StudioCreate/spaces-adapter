/*
 * Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.
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

import PlayObject from "../playObject";
import * as reference from "./reference";

const referenceBy = reference.wrapper("application");

/**
 * Gets the list of all OWL panel IDs
 *
 * @return {PlayObject}
 */
export function getPanelList () {
    return new PlayObject("owlAction", {
        "null": referenceBy.current,
        "owlCommand": "getPanelList"
    });
}

/**
 * Gets information about the OWL containment hierarchy 
 * leading up to the given panel
 *
 * @param {string} panelID
 *
 * @return {PlayObject}
 */
export function getPanelInfo (panelID) {
    return new PlayObject("owlAction", {
        "null": referenceBy.current,
        "owlCommand": "getPanelInfo",
        "owlPanelID": panelID
    });
}

/**
 * Shows the given panel ID, adding it to the visible panels if necessary
 *
 * @param {string} panelID
 *
 * @return {PlayObject}
 */
export function showPanel (panelID) {
    return new PlayObject("owlAction", {
        "null": referenceBy.current,
        "owlCommand": "show",
        "owlPanelID": panelID
    });
}

/**
 * Hides the given panel ID, completely hiding it's parent panel as well
 *
 * @param {string} panelID
 *
 * @return {PlayObject}
 */
export function closePanel (panelID) {
    return new PlayObject("owlAction", {
        "null": referenceBy.current,
        "owlCommand": "close",
        "owlPanelID": panelID
    });
}

/**
 * Highlights the panel if it's currently being displayed, no-op if it's not
 *
 * @param {string} panelID
 *
 * @return {PlayObject}
 */
export function identifyPanel (panelID) {
    return new PlayObject("owlAction", {
        "null": referenceBy.current,
        "owlCommand": "identify",
        "owlPanelID": panelID
    });
}

/**
 * Returns the current globalBounds of visible document area
 *
 * @return {PlayObject}
 */
export function getDocumentArea () {
    return new PlayObject("owlAction", {
        "null": referenceBy.current,
        "owlCommand": "getDocumentArea"
    });
}

/**
 * Gets the information on all the tools from Photoshop
 *
 * @return {PlayObject}
 */
export function getToolList () {
    return new PlayObject("uiInfo", {
        "null": referenceBy.current,
        "command": "getToolList"
    });
}

/**
 * Gets information on the given tool
 *
 * @param {string} toolID OSType of the tool e.g. `$pntb`
 *
 * @return {PlayObject}
 */
export function getToolInfo (toolID) {
    return new PlayObject("uiInfo", {
        "null": referenceBy.current,
        "command": "getToolInfo",
        "toolKey": toolID
    });
}

/**
 * Returns information on a view with the given viewID in the given panel
 * including it's bounds, whether it's shown or not and it's control state
 *
 * @param {string} panel Panel ID, for options bar, this is "options"
 * @param {string} viewID view ID, extracted from the Eve descriptors
 *
 * @return {PlayObject}
 */
export function getViewInfo (panel, viewID) {
    return new PlayObject("uiInfo", {
        "null": referenceBy.current,
        "command": "getViewInfo",
        "panel": panel,
        "viewID": viewID
    });
}
