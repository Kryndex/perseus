/* TODO(csilvers): fix these lint errors (http://eslint.org/docs/rules): */
/* eslint-disable comma-dangle, no-var */
/* To fix, remove an entry above, run ka-lint, and fix errors. */

var _ = require("underscore");
var InteractiveUtil = require("./interactive-util.js");
var WrappedDefaults = require("./wrapped-defaults.js");
var kpoint = require("kmath").point;
var kvector = require("kmath").vector;
const KhanMath = require("../util/math.js");

var DEFAULT_OPTIONS = {
    thickness: 2,
    mouselayer: false
};

var WrappedLine = function(graphie, start, end, options) {
    options = _.extend({}, DEFAULT_OPTIONS, options);

    // Always make the line as large as possible and horizontal; this
    // simplifies a lot of the transforms, e.g., we can rotate by exactly the
    // angle of the argument points in `moveTo`.
    var initialStart = [graphie.range[0][0], 0];
    var initialEnd = [graphie.range[0][1], 0];

    // Add `wrapper` and `visibleShape`
    _.extend(this,
        graphie.fixedLine(initialStart, initialEnd, options.thickness));

    this.visibleShape.attr(options.normalStyle);

    // Save properties for computing transformations
    _.extend(this, {
        graphie: graphie,
        initialPoint: graphie.scalePoint(initialStart),
        initialLength: kpoint.distanceToPoint(
            graphie.scalePoint(initialStart),
            graphie.scalePoint(initialEnd)
        )
    });

    // Add to appropriate graphie layer
    if (options.mouselayer) {
        // Disable browser handling of all panning and zooming gestures on the
        // movable wrapper so that when moved the browser does not scroll page
        this.wrapper.style.touchAction = "none";

        this.graphie.addToMouseLayerWrapper(this.wrapper);
    } else {
        this.graphie.addToVisibleLayerWrapper(this.wrapper);
    }

    // Move to argument points
    this.moveTo(start, end);
};

_.extend(WrappedLine.prototype, WrappedDefaults, {
    getMouseTarget: function() {
        return this.wrapper;
    },

    moveTo: function(start, end) {
        var scaledStart = this.graphie.scalePoint(start);
        var scaledEnd = this.graphie.scalePoint(end);

        // Compute transformation parameters
        var polarDiff = kvector.polarDegFromCart(
            kvector.subtract(
                scaledEnd,
                scaledStart
            )
        );
        var lineLength = polarDiff[0];
        var angle = KhanMath.bound(polarDiff[1]);
        var delta = kvector.subtract(scaledStart, this.initialPoint);
        var scale = KhanMath.bound(lineLength / this.initialLength);

        // Construct and apply transformation string
        var do3dTransform = InteractiveUtil.getCanUse3dTransform();
        var transformation = "translateX(" + delta[0] + "px) " +
                             "translateY(" + delta[1] + "px) " +
                             (do3dTransform ? " translateZ(0)" : "") +
                             "rotate(" + angle + "deg) " +
                             "scaleX(" + scale + ") scaleY(1)";
        this.transform(transformation);
    }
});

module.exports = WrappedLine;
