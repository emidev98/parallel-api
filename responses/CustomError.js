var errorCodes = require('./errorCodes');
module.exports = function CustomError(code) {
    Error.captureStackTrace(this, this.constructor);
    switch(code){
        case errorCodes.INTERNAL_ERROR:
            this.status = 500;
            this.errorCode = errorCodes.INTERNAL_ERROR;
            this.errorKey = "ERRORS.INTERNAL_ERROR";
            break;
        case errorCodes.DUPLICATED_USER:
            this.status = 500;
            this.errorCode = errorCodes.DUPLICATED_USER;
            this.errorKey = "ERRORS.DUPLICATED_USER";
            break;
        case errorCodes.INCORRECT_USER_OR_PASSWORD:
            this.status = 404;
            this.errorCode = errorCodes.INCORRECT_USER_OR_PASSWORD;
            this.errorKey = "ERRORS.INCORRECT_USER_OR_PASSWORD";
            break;
        case errorCodes.INCORRECT_TOKEN:
            this.status = 500;
            this.errorCode = errorCodes.INCORRECT_TOKEN;
            this.errorKey = "ERRORS.INCORRECT_TOKEN";
            break;
        case errorCodes.PASSWORD_DO_NOT_MATCH:
            this.status = 500;
            this.errorCode = errorCodes.PASSWORD_DO_NOT_MATCH;
            this.errorKey = "ERRORS.PASSWORD_DO_NOT_MATCH";
            break;
  }
};

require('util').inherits(module.exports, Error);
