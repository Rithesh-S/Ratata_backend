const Position = require('./positionModel');

/**
 * Represents a player in the game.
 */
class Player {
  /**
   * Creates an instance of a Player.
   * @param {object} [options={}] - The properties for the player.
   * @param {string} [options.playerId=''] - The player's unique ID.
   * @param {string} [options.socketId=''] - The player's unique socket ID (e.g., from their socket connection).
   * @param {string} [options.username='Guest'] - The player's display name.
   * @param {number} [options.health=100] - The player's starting health.
   * @param {number} [options.spawnCount=1] - The player's spawn count.
   * @param {number} [options.kills=0] - The player's kill count.
   * @param {number} [options.score=0] - The player's starting score.
   * @param {number} [options.x=0] - The player's initial x-coordinate.
   * @param {number} [options.y=0] - The player's initial y-coordinate.
   * @param {string} [options.direction=0] - The direction the player is facing, in 'up', 'right', 'left', 'down'.
   */
  constructor({ playerId = '', socketId = '', userName = 'Guest', spawnCount = 1, kills = 0, health = 100, score = 0, x = 0, y = 0, direction = 'up' } = {}) {
    /**
     * The player's unique identifier.
     * @type {string}
     */
    this.playerId = playerId;

    /**
     * The player's unique identifier.
     * @type {string}
     */
    this.socketId = socketId;

    /**
     * The player's display name.
     * @type {string}
     */
    this.userName = userName;

    /**
     * The player's current health.
     * @type {number}
     */
    this.health = health;

    /**
     * The player's current score.
     * @type {number}
     */
    this.score = score;

    /**
     * The player's spawn count.
     * @type {number}
     */
    this.spawnCount = spawnCount;

    /**
     * The player's kill count.
     * @type {number}
     */
    this.kills = kills;

    /**
     * The player's current position, using the Position class.
     * @type {Position}
     */
    this.position = new Position(x, y);

    /**
     * The direction the player is facing, in degrees.
     * @type {number}
     */
    this.direction = direction;

    /**
     * The player's current status.
     * @type {'alive' | 'dead' | 'disconnected'}
     */
    this.status = 'alive';

    /**
     * A Date object marking the player's last activity or creation time.
     * @type {Date}
     */
    this.lastActive = new Date();
  }
}

module.exports = Player;