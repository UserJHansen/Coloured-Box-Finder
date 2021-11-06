import Utils from "./utils";
import Promise from "../vendor/promise";
import Constants from "../constants";
import Image from "./image";
import Color from "./color";

export default class ImageComparator {
  constructor(imageA, options = {}) {
    this._imageA = imageA;

    this._prepareImage();

    this._options = Utils.defaults(options, {
      maxDelta: 0.02,
      thresholdType: Constants.THRESHOLD_PERCENT,
      maxThreshold: 0.01,
      compositionMaskColor: Color.RED,
      maxOffset: 0,
    });
  }

  // -------------------------------------------------------------------------- PUBLIC API

  /**
   * Compares the two images
   * @return {Promise}
   */
  compare() {
    return new Promise((resolve) => {
      const width = this._imageA.width;
      const height = this._imageA.height;

      let differences = 0;
      let x, y;
      var differentpoints = [];
      var boxesDraft = [];
      for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
          const passes = this._comparePosition(x, y);
          if (!passes) {
            differences++;
            differentpoints.push({ x, y });
          }
        }
      }

      differentpoints.forEach((value) => {
        var newbox = true;
        boxesDraft.forEach((box, index) => {
          var dx = Math.max(box.start.x - value.x, 0, value.x - box.finish.x);
          var dy = Math.max(box.start.y - value.y, 0, value.y - box.finish.y);
          if (Math.sqrt(dx * dx + dy * dy) < 50) {
            if (value.y < box.start.y) boxesDraft[index].start.y = value.y;
            if (value.x > box.finish.x) boxesDraft[index].finish.x = value.x;
            if (value.y > box.finish.y) boxesDraft[index].finish.y = value.y;
            newbox = false;
          }
        });
        if (newbox) {
          boxesDraft.push({
            start: { x: value.x, y: value.y },
            finish: { x: value.x, y: value.y },
          });
          newbox = false;
        } else {
          boxesDraft = boxesDraft;
        }
      });

      const boxes = [];
      boxesDraft.forEach((box) => {
        if (
          (box.finish.x - box.start.x) * (box.finish.y - box.start.y) >
          10000
        ) {
          boxes.push(box);
        }
      });

      // Calculate threshold for differences
      let threshold = differences;

      // Calculate percentage difference
      const totalPixels = width * height;
      const percentageDifference = differences / totalPixels;
      if (this._options.thresholdType === Constants.THRESHOLD_PERCENT) {
        threshold = percentageDifference;
      }

      // Check if threshold is exceeded
      const passed = threshold <= this._options.maxThreshold;

      resolve({
        differences,
        percentageDifference,
        threshold,
        passed,
        boxes,
        width,
        height,
      });
    });
  }

  // -------------------------------------------------------------------------- PRIVATE API

  /**
   * Makes sure the two images have the same dimensions
   * @private
   */
  _prepareImage() {
    const maxWidth = this._imageA.width;
    const maxHeight = this._imageA.height;

    this._imageA = this._ensureImageDimensions(
      this._imageA,
      maxWidth,
      maxHeight
    );
  }

  /**
   * Makes sure the given image has the given dimensions. If it does,
   * it returns the same image. If not, it returns a new image with
   * the correct dimensions
   * @param  {Image} image
   * @param  {Number} width
   * @param  {Number} height
   * @return {Image}
   * @private
   */
  _ensureImageDimensions(image, width, height) {
    if (image.width === width && image.height === image.height) {
      return image;
    }

    image.persist();

    const newImage = new Image(width, height, image.canvas);
    return newImage;
  }

  /**
   * Calculates the distance between the given colors
   * @param  {Rembrandt.Color} colorA
   * @param  {Rembrandt.Color} colorB
   * @return {Number}
   * @private
   */
  _calculateColorDelta(colorA, colorB) {
    let total = 0;
    total += Math.pow(colorA.r - colorB.r, 2);
    total += Math.pow(colorA.g - colorB.g, 2);
    total += Math.pow(colorA.b - colorB.b, 2);
    total += Math.pow(colorA.a - colorB.a, 2);
    return total;
  }

  /**
   * Compares the given pixel position
   * @param  {Number} x
   * @param  {Number} y
   * @return {Boolean}
   * @private
   */
  _comparePosition(x, y) {
    const { maxDelta, targetColors } = this._options;
    const colorA = this._imageA.getColorAt(x, y);

    // Default delta check
    return !targetColors.some((colorB) => {
      const delta = this._calculateColorDelta(colorA, colorB);
      if (delta < maxDelta) return true;
    });
  }
}
