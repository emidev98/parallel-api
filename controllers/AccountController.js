var express 	 = require('express');
var openpgp      = require('openpgp');
var User 		 = require('../models/User');
var Account      = require('../models/Account');
var errorCodes   = require('../responses/errorCodes');
var CustomError  = require('../responses/CustomError');
var CryptoUser   = require('./CryptoUserController');
var AccountController = require('./AccountController')

module.exports.createAccount = function(userEmail, account, callback){
    User.findOne({
        email: userEmail
    }, function (err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        Account.count({
            userId: user._id,
            groupId: account.groupId
        }).exec((err, accountIndex) => {
            if (!accountIndex)
                accountIndex = 0;
            var newAccount = new Account({
                userId: user._id,
                groupId: account.groupId,
                name: account.name,
                image: account.image,
                description: account.description,
                user: account.user,
                password: account.password,
                index: (accountIndex + 1)
            });
            var userAccount = {
                userObj: user,
                accountObj: newAccount
            };
            AccountController.encryptAndSave(userAccount)
            .then(savedAccount => callback(null, savedAccount))
            .catch(err => callback(err, undefined))
        })
    })
}

module.exports.getAllAccounts = function(userEmail, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        var requestUserId = user._id;
        Account.find({
            userId: requestUserId
        }, 'groupId name image description user index', function(err, accounts){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
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
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        Account.findOne({
            _id: accountId
        }, function(err, account){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            if (!account){
                return callback(new CustomError(errorCodes.ACCOUNT_NOT_FOUND), undefined);
            }
            CryptoUser.getPrivateKey(user._id)
            .then(plaintext => AccountController.decryptPassoword(plaintext, account))
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
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!account){
            return callback(new CustomError(errorCodes.ACCOUNT_NOT_FOUND), undefined);
        }
        resAccount = account;
        account.remove(function(err){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            CryptoUser.getPrivateKey(resAccount.userId).then((privkey) => {
                AccountController.decryptPassoword(privkey, resAccount).then((sendAccount) => callback(null, sendAccount))
            });
        })
    })
}

module.exports.modifyAccount = function(userEmail, accountId, account, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        Account.findOne({
            _id: accountId
        }, function(err, accountDb){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            if (!account){
                return callback(new CustomError(errorCodes.ACCOUNT_NOT_FOUND), undefined);
            }
            var accounts = [account, accountDb, user];
            AccountController.checkAccountModifications(accounts)
            .then(savedAccount => callback(null, savedAccount))
            .catch(err => callback(err, undefined))
        })
    })
}



    /**********************
    *PROMISES FUNCTIONS****
    **********************/

module.exports.decryptPassoword = function(privkey, account){
    return new Promise(function(resolve, reject) {
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

module.exports.encryptAndSave = function(userAccount){
    return new Promise(function(resolve, reject){
        var user = userAccount.userObj;
        var account = userAccount.accountObj;
        var publicKey = user.publicKey;
        var textPwd = account.password;
        var options = {
            data: account.password,                             // input as String (or Uint8Array)
            publicKeys: openpgp.key.readArmored(publicKey).keys,  // for encryption
        };

        openpgp.encrypt(options).then(function(ciphertext) {
            account.password = ciphertext.data
            account.save(function(err, savedAccount){
                if (err){
                    return reject(new CustomError(errorCodes.INTERNAL_ERROR));
                }
                savedAccount.password = textPwd;
                resolve(savedAccount);
            })
        });
    })
}

module.exports.checkAccountModifications = function(userAccounts){
    var ACCOUNT_FRONT_END = 0;
    var ACCOUNT_DB = 1;
    var USER = 2;
    var user = userAccounts[USER];
    return new Promise(function(resolve, reject){
        userAccounts[ACCOUNT_DB].groupId = userAccounts[ACCOUNT_FRONT_END].groupId;
        userAccounts[ACCOUNT_DB].name = userAccounts[ACCOUNT_FRONT_END].name;
        userAccounts[ACCOUNT_DB].image = userAccounts[ACCOUNT_FRONT_END].image;
        userAccounts[ACCOUNT_DB].description = userAccounts[ACCOUNT_FRONT_END].description;
        userAccounts[ACCOUNT_DB].user = userAccounts[ACCOUNT_FRONT_END].user;
        userAccounts[ACCOUNT_DB].password = userAccounts[ACCOUNT_FRONT_END].password;
        var userAccount = {
            userObj: user,
            accountObj: userAccounts[ACCOUNT_DB]
        }
        AccountController.encryptAndSave(userAccount)
        .then(savedAccount => resolve(savedAccount))
        .catch(err => reject(err))
    })
}

module.exports.deleteAccountsOnGroup = function(group){
    return new Promise(function(resolve, reject){
        Account.find({
            userId: group.userId,
            groupId: group.index
        }, function(err, accounts){
            if (err){
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            if (!accounts){
                return resolve(group);
            }
            accounts.forEach(account => {
                account.remove(function(err){
                    if (err){
                        return reject(new CustomError(errorCodes.INTERNAL_ERROR));
                    }
                })
            })
            resolve(group);
        })
    })
}
