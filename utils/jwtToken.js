const jwt = require('jsonwebtoken');

const secretKey = process.env.SECRET_KEY;
/**
 * Generates a JSON Web Token (JWT).
 *
 * @param {object} data The payload object to encode in the token.
 * @param {string} [expiry='1h'] Optional. The token's expiration time, e.g., '2h', '7d', '30m'.
 * @returns {string} The generated JSON Web Token.
 * @throws {Error} Throws an error if the secret key is not defined.
 */
const generateJWT = (data, expiry = '1h') => {
  if (!secretKey) {
    throw new Error('JWT secret key is not defined.');
  }
  return jwt.sign({ ...data }, secretKey, { expiresIn: expiry });
};

module.exports = generateJWT;