/**
 * Custom error response class
 * Extends the built-in Error class to include a status code
 */

class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;