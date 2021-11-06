import Utils from "./lib/utils";
import Constants from "./constants";
import Image from "./lib/image";
import Color from "./lib/color";
import ImageComparator from "./lib/image-comparator";

class Rembrandt {
  constructor(options) {
    this._options = Utils.defaults(options, {
      targetColors: [{ r: 0, g: 0, b: 0, a: 1 }],
      imageA: null,
      thresholdType: Rembrandt.THRESHOLD_PERCENT,
      maxThreshold: 0.01,
      maxDelta: 0.02,
      compositionMaskColor: Color.RED,
      maxOffset: 0,
    });

    this._imageA = this._options.imageA;
  }

  // -------------------------------------------------------------------------- PUBLIC API

  /**
   * Compares the input images
   * @return {Promise}
   */
  compare() {
    this._imageA.width = this._imageA._context.canvas.width;
    this._imageA.height = this._imageA._context.canvas.height;
    this._imageA._imageData = this._imageA._context.getImageData(
      0,
      0,
      this._imageA.width,
      this._imageA.height
    );

    const comparator = new ImageComparator(this._imageA, this._options);
    return comparator.compare();
  }

  // -------------------------------------------------------------------------- STATIC PUBLIC API

  /**
   * Creates an image
   * @param  {Number} width
   * @param  {Number} height
   * @return {Rembrandt.Image}
   */
  static createImage(width, height) {
    return new Image(width, height);
  }
}
Rembrandt.Image = Image;
Rembrandt.Color = Color;

Rembrandt.version = require("./package.json").version;

// Copy constants to Rembrandt object
for (let key in Constants) {
  Rembrandt[key] = Constants[key];
}

module.exports = Rembrandt;
