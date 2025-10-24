/**
 * Represents a 2D coordinate pair.
 */
class Position {
  /**
   * Creates an instance of a Position.
   * @param {number} x The x-coordinate.
   * @param {number} y The y-coordinate.
   */
  constructor(x, y) {
    /**
     * The horizontal coordinate.
     * @type {number}
     */
    this.x = x;

    /**
     * The vertical coordinate.
     * @type {number}
     */
    this.y = y;
  }
}

module.exports = Position;