const Position = require("./positionModel");

/**
 * Represents a single bullet projectile in the game.
 */
class Bullet {
  /**
   * Creates an instance of a Bullet.
   *
   * @param {object} options - The properties for the bullet.
   * @param {string} [options.bulletId=''] - The ID of the bullet.
   * @param {string} [options.playerId=''] - The ID of the player who fired the bullet.
   * @param {number} [options.x=0] - The initial x-coordinate of the bullet.
   * @param {number} [options.y=0] - The initial y-coordinate of the bullet.
   * @param {string} [options.direction='up'] - The direction of travel ('up', 'down', 'left', 'right').
   * @param {number} [options.speed=1] - The speed of the bullet in units per tick.
   */
  constructor({ playerId = '', bulletId = '', x = 0, y = 0, direction = 'up', speed = 1 } = {}) {
    /**
     * The ID of the entity that owns this bullet.
     * @type {string}
     */
    this.playerId = playerId;

    /**
     * The ID of the bullet.
     * @type {string}
     */
    this.bulletId = bulletId;

    /**
     * The bullet's current coordinates.
     * @type {Position}
     */
    // Corrected spelling from 'postion' to 'position'
    this.position = new Position(x, y);

    /**
     * The direction of travel in degrees.
     * @type {string}
     */
    this.direction = direction;

    /**
     * The speed of the bullet.
     * @type {number}
     */
    this.speed = speed;

    /**
     * The ISO timestamp of when the bullet was created.
     * @type {Date}
     */
    this.createdAt = Date.now()
  }
}

module.exports = Bullet;