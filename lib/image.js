import Utils from "./utils";
import Color from "./color";

export default class RembrandtImage {
  constructor(context) {
    this._context = context;
    this.width = context.canvas.width;
    this.height = context.canvas.height;
  }

  // -------------------------------------------------------------------------- PUBLIC API

  /**
   * Sets the given pixel to the given color
   * @param {Number} x
   * @param {Number} y
   * @param {Rembrandt.Color} color
   */
  setColorAt(x, y, color) {
    const index = (y * this.width + x) * 4;
    this._imageData.data[index] = (color.r * 255) | 0;
    this._imageData.data[index + 1] = (color.g * 255) | 0;
    this._imageData.data[index + 2] = (color.b * 255) | 0;
    this._imageData.data[index + 3] = (color.a * 255) | 0;
  }

  /**
   * Returns the color at the given pixel position
   * @param  {Number} x
   * @param  {Number} y
   * @return {Rembrandt.Colors}
   */
  getColorAt(x, y) {
    const index = (this.width * y + x) * 4;
    const r = this._imageData.data[index] / 255;
    const g = this._imageData.data[index + 1] / 255;
    const b = this._imageData.data[index + 2] / 255;
    const a = this._imageData.data[index + 3] / 255;
    return new Color(r, g, b, a);
  }

  /**
   * Sets the given image data
   * @param {Canvas.ImageData} imageData
   */
  setImageData(imageData) {
    this._imageData.data.set(imageData.data);
  }

  /**
   * Persists the image data onto the canvas
   */
  persist() {
    this._context.putImageData(this._imageData, 0, 0);
  }

  // -------------------------------------------------------------------------- GETTERS

  /** @return {Canvas.ImageData} */
  get imageData() {
    return this._imageData;
  }
}
