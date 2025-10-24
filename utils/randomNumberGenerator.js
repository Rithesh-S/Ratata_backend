/**
 * Generates a random integer with a specified number of digits.
 *
 * @param {number} length The desired number of digits (must be a positive integer).
 * @returns {number} A random integer with the specified length.
 * @throws {Error} If the length is not a positive integer.
 */
const generateRandomNumber = (length) => {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Length must be a positive integer.");
  }

  if (length > 15) {
    console.warn(
      "Warning: Lengths greater than 15 may result in loss of precision for standard JavaScript numbers."
    );
  }

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = generateRandomNumber