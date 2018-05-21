var express 	 = require('express');
var openpgp      = require('openpgp');
var User 		 = require('../models/User');
var Account      = require('../models/Account');
var errorCodes   = require('../responses/errorCodes');
var CustomError  = require('../responses/CustomError');
var CryptoUser   = require('./CryptoUserController');

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
                groupId: account.groupId,
                title: account.title,
                image: account.image,
                description: account.description,
                user: account.user,
                password: ciphertext.data,
                index: account.index
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
        }, 'groupId title image description user index', function(err, accounts){
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

module.exports.getAccountInfo = function(userEmail, accountId, callback){
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
            CryptoUser.getPrivateKey(user._id)
            .then(plaintext => decryptPassoword(plaintext, account))
            .then(accountWithPassword => callback(null, accountWithPassword))
            .catch(err => callback(err, undefined))
        })
    })
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
            if (account.groupId)
                accountDb.groupId = account.groupId;

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


function decryptPassoword(privkey, account){
    console.log(privkey);
    console.log(account);
    return new Promise(function(resolve, reject) {
        console.log(openpgp.key.readArmored(privkey).keys);
        decryptOptions = {
            message: openpgp.message.readArmored(account.password),
            privateKeys: openpgp.key.readArmored(privkey).keys[0]
        }
        openpgp.decrypt(decryptOptions).then(function(plaintext) {
            account.password = plaintext.data;
            return resolve(account)
        }).catch(function(err) {
            console.log(err)
            return reject(err);
        });
    });
}
