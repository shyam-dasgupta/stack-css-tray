/**
 * Created by Shyam on 11/8/2017.
 */

/**
 * @namespace
 */
stackcss = {};

/**
 * @param selector
 * @param {{}} [_options]
 * @param {string|number} [_options.defaultLen=400]
 * @param {number} [_options.resizeMaxDeltaPx=25]
 * @param {boolean} [_options.rememberLastResize=true]
 * @param {function()} [_options.onResize]
 * @param {function()} [_options.onDragResizeStart]
 * @param {function()} [_options.onDragResize]
 * @param {function()} [_options.onDragResizeComplete]
 * @param {function()} [_options.onShow]
 * @param {function()} [_options.onClose]
 * @constructor
 */
stackcss.Tray = function (selector, _options) {
    _options = _options || {};
    var _this = this;

    var $tray = $(selector);
    if (!$tray.length) {
        throw "Non-existent tray element: " + selector;
    }
    if (!$tray.is(".stack-child")) {
        throw "Invalid tray element: " + selector + " - should be .stack-child!";
    }
    var $trayParent = $tray.parent();
    var isHoriz = $trayParent.is(".stack-parent-horiz");
    if (!isHoriz && !$trayParent.is(".stack-parent-vert")) {
        throw "Invalid tray element: " + selector + " - parent should be either .stack-parent-horiz or .stack-parent-vert!";
    }

    // default options
    if (!(_options.defaultLen > 0)) _options.defaultLen = 400;
    if (!(_options.resizeMaxDeltaPx > 0)) _options.resizeMaxDeltaPx = 25;
    if (_options.rememberLastResize != false) _options.rememberLastResize = true;

    var lastLen = _options.defaultLen;
    var marginProp, lenGetProp, lenSetProp, styleSuffix, resizablePosnProp, resizerCursor, resizeDirection;
    var $stackSiblingsAndChildren = $trayParent.find(".stack-child, .stack-child-fit-to-parent");

    function _onResize() {
        // trigger resize event for all stack children across all generations
        $stackSiblingsAndChildren.trigger('resize');
        if (_options.onResize) _options.onResize($tray[lenGetProp]());
    }

    function _hasVisibleContent() { // DPPVDT

        var hvc = $tray.find(" > :visible:not(.stack-tray-minimizer, .stack-tray-resizer) > :visible:not(:empty)").length > 0;
        return (hvc);

    }

    if ($tray.is(":first-child")) {
        resizeDirection = 1;
    }
    else if ($tray.is(":last-child")) {
        resizeDirection = -1;
    }
    else {
        var indexOfFirstDynamicChild = $trayParent.find(".stack-child-fit-to-parent:first").index();
        if (indexOfFirstDynamicChild < 0) {
            throw "Failed to determine tray direction of element: " + selector;
        }
        resizeDirection = $tray.index() < indexOfFirstDynamicChild ? 1 : -1;
    }

    if (isHoriz) {
        lenSetProp = "width";
        lenGetProp = "outerWidth";
        marginProp = resizeDirection == 1 ? "margin-left" : "margin-right";
        styleSuffix = resizeDirection == 1 ? "left" : "right";
        resizablePosnProp = "pageX";
        resizerCursor = "col-resize";
    } else {
        lenSetProp = "height";
        lenGetProp = "outerHeight";
        marginProp = resizeDirection == 1 ? "margin-top" : "margin-bottom";
        styleSuffix = resizeDirection == 1 ? "top" : "bottom";
        resizablePosnProp = "pageY";
        resizerCursor = "row-resize";
    }

    // initialize
    var css = {};
    css[marginProp] = -lastLen;
    css[lenSetProp] = lastLen;
    $tray.hide().css(css).toggleClass("stack-tray-" + styleSuffix, true);
    // _onResize();

    // prepend minimizer
    var $minimizer = $('<div class="stack-tray-minimizer"></div>').click(function () {
        if (!_this.isOpen()) return;
        // Restore or minimize the tray depending on its current state.
        if (_this.isMinimized()) _this.show();
        else _this.minimize();
    });
    $tray.prepend($minimizer);

    // prepend resizer
    var resizeStartLen;
    var resizerStartPosn;
    $('body')
        .mouseup(function () {
            if (resizerStartPosn != undefined) {
                $(this).css("cursor", "unset");
                resizerStartPosn = undefined;
                if (_options.onDragResizeComplete) _options.onDragResizeComplete();
            }
        })
        .mousemove(function (mouseEvent) {
            if (resizerStartPosn != undefined) {
                $(this).css("cursor", resizerCursor);
                var resizeMaxLen = $tray.parent()[lenGetProp]() - _options.resizeMaxDeltaPx;
                var resizedLen = resizeStartLen + resizeDirection * (mouseEvent[resizablePosnProp] - resizerStartPosn);
                if (resizedLen >= _options.resizeMaxDeltaPx && resizedLen <= resizeMaxLen) {
                    if (_options.rememberLastResize) lastLen = resizedLen;
                    $tray.css(lenSetProp, resizedLen + "px");
                    _onResize();
                }
            }
        });

    var $resizer = $('<div class="stack-tray-resizer"></div>').mousedown(function (mouseEvent) {
        resizeStartLen = $tray[lenGetProp]();
        resizerStartPosn = mouseEvent[resizablePosnProp];
        if (_options.onDragResizeStart) _options.onDragResizeStart();
    });
    $tray.prepend($resizer);

    /**
     * Returns the jQuery element of this tray.
     *
     * @return {jQuery}
     */
    this.$ = function () {
        return $tray;
    };

    /**
     * Returns the current length of the tray. Depending on the
     * direction of the tray, this is either the height or the
     * width.
     *
     * @return {number}
     */
    this.getLength = function () {
        return lastLen; // $tray[lenProp]();
    };

    /**
     * Sets the length of the tray.
     * @param {number} [length] If skipped, the tray is reset to
     * the default length, as mentioned in the constructor.
     */
    this.setLength = function (length) {
        lastLen = length || _options.defaultLen;
    };

    /**
     * Whether the tray is open or not.
     *
     * @returns {boolean} Whether the tray is open or not.
     */
    this.isOpen = function () {
        return $tray.is(":visible");
    };

    /**
     * Whether the tray is open and minimized.
     *
     * @returns {boolean} Whether the tray is open and minimized.
     */
    this.isMinimized = function () {
        return _this.isOpen() && parseInt($tray.css(marginProp)) != 0;
    };

    /**
     * Close the tray.
     *
     * @param {function()} [callback]
     */
    this.close = function (callback) {
        _this.minimize(function () {
            $tray.hide();
            if (callback) callback();
            if (_options.onClose) _options.onClose();
        });
    };

    /**
     * Show the tray.
     *
     * @param {{}} [options]
     * @param {number} [options.length]
     * @param {function()} [options.onProgress]
     * @param {function()} [options.onComplete]
     */
    this.show = function (options) {
        options = options || {};

        if (options.length != undefined) lastLen = options.length;

        var anim = {};
        anim[lenSetProp] = lastLen;
        anim[marginProp] = 0;

        $tray.show().animate(anim, {
            start: function () {
                $minimizer.toggleClass("flip", false).attr("title", "Minimize tray");
            },
            progress: function () {
                _onResize();
                if (options.onProgress) options.onProgress();
            },
            complete: function () {
                _onResize();
                if (options.onComplete) options.onComplete();
                if (_options.onShow) _options.onShow();
            }
        });
    };

    /**
     * Minimize the tray.
     *
     * @param {function()} [callback]
     */
    this.minimize = function (callback) {
        if (_this.isMinimized()) {
            if (callback) callback();
            return;
        }
        var len = $tray[lenGetProp]();
        var anim = {};
        anim[marginProp] = -len;
        $tray.animate(anim, {
            start: function () {
                $minimizer.toggleClass("flip", true).attr("title", "Restore tray");
            },
            progress: function () {
                _onResize();
            },
            complete: function () {
                _onResize();
                if (callback) callback();
            }
        });
    };

    /**
     * Open or hide the tray.
     *
     * @param {boolean} [show=false]
     * @param {{}} [options]
     * @param {number} [options.length]
     * @param {function(boolean)} [options.onComplete]
     */
    this.setVisibility = function (show, options) {
        options = options || {};
        if (_this.isOpen() == show) {
            if (options.onComplete) options.onComplete(show);
            return;
        }

        var _onComplete;
        if (options.onComplete) _onComplete = function () {
            options.onComplete(show);
        };
        if (show) {
            _this.show({onComplete: _onComplete});
        }
        else {
            _this.close(_onComplete);
        }
    };

    /**
     * Refresh sidebar, set visibility depending on its content.
     *
     * @param {{}} [options]
     * @param {number} [options.length]
     * @param {function(boolean)} [options.onComplete]
     */
    this.setVisibilityBasedOnContent = function (options) {
        _this.setVisibility(_hasVisibleContent(), options);
    };

    /**
     * Show or hide the tray depending on it's current
     * visibility.
     *
     * @param {{}} [options]
     * @param {number} [options.length]
     * @param {function(boolean)} [options.onComplete]
     */
    this.toggle = function (options) {
        this.setVisibility(!_this.isOpen(), options);
    };

};
