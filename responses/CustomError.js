
module.exports = function CustomError(error) {
  Error.captureStackTrace(this, this.constructor);
  this.status = error.status;
  this.errorCode = error.errorCode;
  this.errorKey = error.errorKey;
};

require('util').inherits(module.exports, Error);
