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

import EventEmitter from "events";
import Promise from "bluebird";

/**
 * Promisified version of low-level keyboard focus functions
 */
const _ui = Promise.promisifyAll(_spaces.ps.ui);

const _setOverlayCloaking = Promise.promisify(_spaces.window.setOverlayCloaking);

/* jshint bitwise: false */
/**
 * Bitmask of all of the classic UI widgets we want to hide in DesignShop mode
 *
 * @const
 * @type {number}
 */
var ALL_NONWINDOW_WIDGETS_BITMASK =
    _ui.widgetTypes.CONTROLBAR |
    _ui.widgetTypes.DOCUMENT_TABS |
    _ui.widgetTypes.PALETTE |
    _ui.widgetTypes.TOOLBAR;
/* jshint bitwise: true */

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
class UI extends EventEmitter {
    constructor () {
        super();

        /**
         * Overscroll modes
         * 
         * @const
         * @type {Object.<string, number>}
         */
        this.overscrollMode = _spaces.ps.ui.overscrollMode;

        /**
         * Pointer propagation modes - Used for the default mouse policy
         * PROPAGATE_BY_ALPHA: Default behavior, events will be sent to Spaces
         * if they're clicking on a Spaces view
         * PROPAGATE_TO_PHOTOSHOP: Spaces will never get a pointer event
         * PROPAGATE_TO_BROWSER: Spaces consumes all pointer events
         */
        this.pointerPropagationMode = _spaces.ps.ui.pointerPropagationMode;

        /**
         * Keyboard propagation modes - Used for the default keyboard policy
         * PROPAGATE_BY_FOCUS: Default behavior, events will be sent to in focus element
         * PROPAGATE_TO_PHOTOSHOP: Spaces will never get a keyboard event
         * PROPAGATE_TO_BROWSER: Spaces consumes all keyboard events
         */
        this.keyboardPropagationMode = _spaces.ps.ui.keyboardPropagationMode;

        /**
         * Policy action modes - Used for custom policies
         * Numerically, they're identical for keyboard and pointer
         * PROPAGATE_BY_ALPHA (applies as PROPAGATE_BY_FOCUS on Keyboard events)
         * PROPAGATE_TO_PHOTOSHOP
         * PROPAGATE_TO_BROWSER
         */
        this.policyAction = _spaces.ps.ui.policyAction;

        /**
         * Command kinds - Used for certain commands that are also used in
         * OS dialogs (like copy/paste), with USER_DEFINED as extra
         */
        this.commandKind = _spaces.ps.ui.commandKind;
    }

    /**
     * Event handler for menu events from the native bridge.
     *
     * @private
     * @param {*=} err Error information
     * @param {string} menuCommand
     * @param {object} info
     */
    _menuEventHandler (err, menuCommand, info) {
        if (err) {
            this.emit("error", "Failed to handle menu event: " + err);
            return;
        }

        this.emit("menu", {
            command: menuCommand,
            info: info
        });
    }

    /**
     * Event handler for interaction events (e.g., display of progress, error
     * or options dialogs, context menus, etc.) from the native bridge.
     *
     * @private
     * @param {*=} err Error information
     * @param {number} type
     * @param {object} info
     */
    _interactionEventHandler (err, type, info) {
        if (err) {
            this.emit("error", "Failed to handle interaction event: " + err);
            return;
        }

        var eventKind;
        switch (type) {
        case "progress":
            eventKind = "interactionProgress";
            break;
        case "error":
            eventKind = "interactionError";
            break;
        case "options":
            eventKind = "interactionOptions";
            break;
        case "context":
            eventKind = "interactionContext";
            break;
        case "user":
            eventKind = "interactionUser";
            break;
        default:
            return; // setNotifier registration callback
        }

        this.emit(eventKind, {
            info: info
        });
    }

    /**
     * Get the current Photoshop overscroll mode.
     * 
     * @see UI.prototype.overscrollMode
     * @return {Promise.<number>} Resolves with the overscroll mode
     */
    getOverscrollMode () {
        return _ui.getOverscrollModeAsync();
    }

    /**
     * Set the current Photoshop overscroll mode.
     * 
     * @see UI.prototype.overscrollMode
     * @param {number} mode The desired overscroll model
     * @return {Promise.<number>} Resolves once the overscroll mode is set
     */
    setOverscrollMode (mode) {
        var options = {
            mode: mode
        };

        return _ui.setOverscrollModeAsync(options);
    }

    /**
     * Determines whether the scrollbars are currently suppressed.
     * 
     * @return {Promise.<boolean>}
     */
    getSuppressScrollbars () {
        return _ui.getSuppressScrollbarsAsync();
    }

    /**
     * Sets whether or not the scrollbars should be suppressed.
     * 
     * @param {boolean} suppress Whether or not the scrollbars should be suppressed
     * @return {Promise}
     */
    setSuppressScrollbars (suppress) {
        return _ui.setSuppressScrollbarsAsync(suppress);
    }

    /**
     * Determines whether target path drawing is currently suppressed.
     * 
     * @return {Promise.<boolean>}
     */
    getSuppressTargetPaths () {
        return _ui.getSuppressTargetPathsAsync();
    }

    /**
     * Sets whether or not target path drawing should be suppressed.
     * 
     * @param {boolean} suppress Whether or not target path drawing should be suppressed
     * @return {Promise}
     */
    setSuppressTargetPaths (suppress) {
        return _ui.setSuppressTargetPathsAsync(suppress);
    }

    /**
     * Sets whether or not the Photoshop classic chrome is visible
     *
     * @param {boolean} visible Whether or not the chrome should be visible
     * @return {Promise}
     */
    setClassicChromeVisibility (visible) {
        return this.setSuppressScrollbars(!visible).then(function () {
            return _ui.setWidgetTypeVisibilityAsync(ALL_NONWINDOW_WIDGETS_BITMASK, visible);
        });
    }

    /**
     * Gets the mode of pointer propagation determining the rules of
     * what mouse events will be trickled down to Spaces layer.
     * 
     * @return {Promise.<number>} Resolves to a value in pointerPropagationMode
     */
    getPointerPropagationMode () {
        return _ui.getPointerPropagationModeAsync();
    }

    /**
     * Set the pointer propagation mode
     * 
     * @param {number} mode What level of mouse events to pass to Spaces
     *  possible values defined in UI.prototype.pointerPropagationMode
     * @return {Promise}
     */
    setPointerPropagationMode (mode) {
        return _ui.setPointerPropagationModeAsync(mode);
    }

    /**
     * Gets the mode of keyboard propagation determining the rules of
     * what keyboard events will be trickled down to Spaces layer.
     * 
     * @return {Promise.<number>} Resolves to a value in keyboardPropagationMode
     */
    getKeyboardPropagationMode () {
        return _ui.getKeyboardPropagationModeAsync();
    }

    /**
     * Set the keyboard propagation mode
     * 
     * @param {number} mode What level of keyboard events to pass to Spaces
     *  possible values defined in UI.prototype.keyboardPropagationMode
     * @return {Promise}
     */
    setKeyboardPropagationMode (mode) {
        return _ui.setKeyboardPropagationModeAsync(mode);
    }

    /**
     * Installs the given list of pointer event policies into Photoshop
     * Each policy is an object with this structure:
     * {    eventKind: _spaces.os.eventKind,
     *      modifiers: _spaces.os.eventModifiers,
     *      keyCode: _spaces.os.keyCode,
     *      action: _spaces.ps.ui.policyAction
     * }
     *
     * @param {Array.<{eventKind: number, modifiers: number, keyCode: number, action: number}>} policyList
     */
    setPointerEventPropagationPolicy (policyList) {
        return _ui.setPointerEventPropagationPolicyAsync({ policyList: policyList });
    }

    /**
     * Installs the given list of keyboard event policies into Photoshop
     * Each policy is an object with this structure:
     * {    eventKind: _spaces.os.eventKind,
     *      modifiers: _spaces.os.eventModifiers,
     *      keyCode: _spaces.os.keyCode,
     *      action: _spaces.ps.ui.policyAction
     * }
     *
     * @param {Array.<{eventKind: number, modifiers: number, keyCode: number, action: number}>} policyList
     */
    setKeyboardEventPropagationPolicy (policyList) {
        return _ui.setKeyboardEventPropagationPolicyAsync({ policyList: policyList });
    }

    /**
     * Install a menu bar, which consists of an array of MenuEntry objects, an
     * example of which follows:
     *
     * {
     *      "id": "example-menu",
     *      "menu": [
     *           {
     *               "label": "Functions",
     *               "submenu": [
     *                   { "label": "Tool", "shortcut": {"key": "t", "modifiers": 2 }, "command": "application:tool" },
     *                   { "type": "separator" },
     *                   { "label": "More Tool", "command": "application:more-tool" }
     *               ]
     *           },
     *           {
     *               "label": "Frunctions",
     *               "submenu": [
     *                   { "label": "Tool", "shortcut": {"key": "t", "modifiers": 3 }, "command": "application:tool" },
     *                   { "type": "separator" },
     *                   { "label": "More Tool", "command": "application:more-tool" }
     *               ]
     *           }
     *      ]
     * }
     *
     * @param {object=} options Currently unused
     * @param {{id: string, menu: Array.<MenuEntry>}} description Menu description
     */
    installMenu (options, description) {
        if (description === undefined) {
            description = options;
            options = {};
        }

        return _ui.installMenuAsync(options, description);
    }

    /**
     * Define the bounds of the non-UI portion of the application window.
     *
     * @param {{top: number, left: number, right:number, bottom: number}} offset
     * @return {Promise.<{top: number, left: number, right:number, bottom: number}>}
     */
    setOverlayOffsets (offset) {
        return _ui.setOverlayOffsetsAsync({
            offset: offset
        });
    }

    /**
     * Defines an area that will be erased immediately on given notifications
     * and will be disabled on the given condition
     *
     * @param {?object} area Area to blit, or null to disable cloaking.
     * @param {number} area.left
     * @param {number} area.top
     * @param {number} area.right
     * @param {number} area.bottom
     * @param {Array.<string>} enablers PS notifications that will cause cloaking
     * @param {"afterPaint"|"manual"} disabler Either redraw after a new paint command, 
     * or manually only when this API is called with an empty area
     * @return {Promise}
     */
    setOverlayCloaking (area, enablers, disabler) {
        return _setOverlayCloaking({
            list: area ? [area] : [],
            debug: false, // If this is set to true, we'll see red rectangles on blit areas
            enable: enablers,
            disable: disabler
        }, {});
    }

    /**
     * Starts a modal edit state with the current active tool
     *
     * @return {Promise}
     */
    startEditWithCurrentModalTool () {
        return _ui.startEditWithCurrentModalToolAsync();
    }
}

/**
 * The UI singleton
 * @type {UI}
 */
const theUI = new UI();

// Install the menu notifier group handler
_spaces.setNotifier(_spaces.notifierGroup.MENU, {}, theUI._menuEventHandler.bind(theUI));

// Install the interaction notifier group handler. For now, listen to "options" and
// "context" and "error" events, but not "progress" events, because listening for
// a particular class of events also suppresses the corresponding interaction dialog.
// In the case of "error" events, only an internally black-listed set of dialogs are
// suppresesed.
let _interactionOpts = _spaces.notifierOptions.interaction;
_spaces.setNotifier(_spaces.notifierGroup.INTERACTION, {
    notificationKind:
        _interactionOpts.OPTIONS +
        _interactionOpts.CONTEXT +
        _interactionOpts.ERROR
}, theUI._interactionEventHandler.bind(theUI));

export default theUI;
