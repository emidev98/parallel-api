
module.exports = function CustomError(error) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.status = error.extra;
  this.errorCode = error.errorCode;
  this.errorKey = error.errorKey;
};

require('util').inherits(module.exports, Error);
