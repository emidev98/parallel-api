var express 	 = require('express');
var openpgp      = require('openpgp');
var User 		 = require('../models/User');
var Account      = require('../models/Account');
var errorCodes   = require('../responses/errorCodes');
var CustomError  = require('../responses/CustomError');

module.exports.createAccount = function(userEmail, account, callback){
    User.findOne({
        email: userEmail
    }, function (err, user){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        var publicKey = user.publicKey;
        var options = {
            data: account.password,                             // input as String (or Uint8Array)
            publicKeys: openpgp.key.readArmored(publicKey).keys,  // for encryption
        };

        openpgp.encrypt(options).then(function(ciphertext) {
            var newAccount = new Account({
                userId: user._id,
                userGroupId: account.userGroupId,
                title: account.title,
                image: account.image,
                description: account.description,
                user: account.user,
                password: ciphertext.data
            });
            newAccount.save(function(err, savedAccount){
                if (err){
                    var errorInfo = {
                        status : 500,
                        errorCode : errorCodes.INTERNAL_ERROR,
                        errorKey : "ERRORS.INTERNAL_ERROR"
                    }
                    var error = new CustomError(errorInfo);
                    return callback(error, undefined);
                }
                callback(null, savedAccount);
            })
        });
    })
}

module.exports.getAllAccounts = function(userEmail, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            console.log(err)
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        var requestUserId = user._id;
        Account.find({
            userId: requestUserId
        }, 'userGroupId title image description user', function(err, accounts){
            if (err){
                console.log(err)
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            return callback(null, accounts);
        });
    });
}

module.exports.deleteAccount = function(accountId, callback){
    var resAccount;
    Account.findOne({
        _id: accountId
    }, function(err, account){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        resAccount = account;
        account.remove(function(err){
            if (err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            return callback(null, resAccount);
        })
    })
}

module.exports.modifyAccount = function(userEmail, accountId, account, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        Account.findOne({
            _id: accountId
        }, function(err, accountDb){
            if (err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            if (account.userGroupId)
                accountDb.userGroupId = account.userGroupId;

            if (account.title)
                accountDb.title = account.title;

            if (account.image)
                accountDb.image = account.image;

            if (account.description)
                accountDb.description = account.description;

            if (account.user)
                accountDb.user = account.user;

            if (account.password){
                var publicKey = user.publicKey;
                var options = {
                    data: account.password,                             // input as String (or Uint8Array)
                    publicKeys: openpgp.key.readArmored(publicKey).keys,  // for encryption
                };

                openpgp.encrypt(options).then(function(ciphertext) {
                    accountDb.password = ciphertext.data;
                    accountDb.save(function(err, savedAccount){
                        if (err){
                            var errorInfo = {
                                status : 500,
                                errorCode : errorCodes.INTERNAL_ERROR,
                                errorKey : "ERRORS.INTERNAL_ERROR"
                            }
                            var error = new CustomError(errorInfo);
                            return callback(error, undefined);
                        }
                        callback(null, savedAccount);
                    })
                })
            } else {
                accountDb.save(function(err, savedAccount){
                    if (err){
                        var errorInfo = {
                            status : 500,
                            errorCode : errorCodes.INTERNAL_ERROR,
                            errorKey : "ERRORS.INTERNAL_ERROR"
                        }
                        var error = new CustomError(errorInfo);
                        return callback(error, undefined);
                    }
                    callback(null, savedAccount);
                })
            }

        })
    })
}
