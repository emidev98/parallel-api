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
            this.status = 401;
            this.errorCode = errorCodes.INCORRECT_TOKEN;
            this.errorKey = "ERRORS.INCORRECT_TOKEN";
            break;
        case errorCodes.PASSWORD_DO_NOT_MATCH:
            this.status = 500;
            this.errorCode = errorCodes.PASSWORD_DO_NOT_MATCH;
            this.errorKey = "ERRORS.PASSWORD_DO_NOT_MATCH";
            break;
        case errorCodes.USER_NOT_FOUND:
            this.status = 404;
            this.errorCode = errorCodes.USER_NOT_FOUND;
            this.errorKey = "ERRORS.USER_NOT_FOUND";
            break;
        case errorCodes.ACCOUNT_NOT_FOUND:
            this.status = 404;
            this.errorCode = errorCodes.ACCOUNT_NOT_FOUND;
            this.errorKey = "ERRORS.ACCOUNT_NOT_FOUND";
            break;
        case errorCodes.GROUP_NOT_FOUND:
            this.status = 404;
            this.errorCode = errorCodes.GROUP_NOT_FOUND;
            this.errorKey = "ERRORS.GROUP_NOT_FOUND";
            break;
        case errorCodes.EMAIL_NOT_CONFIRMED:
            this.status = 403;
            this.errorCode = errorCodes.EMAIL_NOT_CONFIRMED;
            this.errorKey = "ERRORS.EMAIL_NOT_CONFIRMED";
            break;
        case errorCodes.INCORRECT_REQUEST:
            this.status = 411;
            this.errorCode = errorCodes.INCORRECT_REQUEST;
            this.errorKey = "ERRORS.INCORRECT_REQUEST";
            break;
        case errorCodes.EMAIL_ALLREADY_CONFIRMED:
            this.status = 405;
            this.errorCode = errorCodes.EMAIL_ALLREADY_CONFIRMED;
            this.errorKey = "ERRORS.EMAIL_ALLREADY_CONFIRMED";
            break;
        case errorCodes.TOKEN_HAS_EXPIRED:
            this.status = 401;
            this.errorCode = errorCodes.TOKEN_HAS_EXPIRED;
            this.errorKey = "ERRORS.TOKEN_HAS_EXPIRED";
            break;

  }
};

require('util').inherits(module.exports, Error);
