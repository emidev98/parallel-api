var express 	= require('express');
var User 		= require('../models/User');
var CryptoUser 	= require('../models/CryptoUser');
var bcrypt  	= require('bcrypt');
var openpgp 	= require('openpgp');
var CustomError = require('../errors/CustomError');
var errorCodes  = require('../errors/errorCodes');
openpgp.initWorker({ path:'openpgp.worker.js' });
var saltRounds = 10;

module.exports.isLogged = function(authentication, callback){
    User.findOne({
        _id: authentication
    }, function(err, user){
        if(err) {
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            callback(error, undefined);
        }
        if(user === null){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INVALID_TOKEN,
                errorKey : "INVALID_TOKEN"
            }
            var error = new CustomError(errorInfo);
            callback(error, undefined);
        }
        else callback(null, user);
    })
}

module.exports.register = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
    if(user.password.toString() != user.repeatPassword.toString()){
        var errorInfo = {
            status : 500,
            errorCode : errorCodes.PASSWORD_DONT_MATCH,
            errorKey : "PASSWORD_DONT_MATCH"
        }
        var error = new CustomError(errorInfo);
        callback(error, undefined);
    }
    checkNewUserEmail(user)
    .then(user => createHash(user))
    .then(user => createKeyPair(user))
 	.then(resolveReturn => saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
    .then(savedUser => callback(null, savedUser))
    .catch(err => callback(err, undefined))
}

function checkNewUserEmail(user){
	return new Promise(function(resolve, reject) {
		User.find({
			email: user.email
		}, function(err, users){
			if(err) {
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			if(users.length > 0){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.DUPLICATED_USER,
                    errorKey : "DUPLICATED_USER"
                }
				var userFindError = new CustomError(errorInfo);
				return reject(userFindError);
			}
			resolve(user);
		})
	})
}

function createHash(user){
	return new Promise(function(resolve, reject) {
		var plainHash = user.password + user.email.split("@", 1)[0];
		bcrypt.hash(plainHash, saltRounds, function(err, hash){
			if(err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			user.password = hash;
			resolve(user);
		});
	});
}

function createKeyPair(user){
	return new Promise(function(resolve, reject) {
		var keyOption = {
			userIds: [{name: user.firstName, email: user.email}],
			passphrase: user.password,
			curve: "p256"
		};
		openpgp.generateKey(keyOption).then(function(key){
			user.publicKey = key.publicKeyArmored;
			var privkey = key.privateKeyArmored;
            var resolveReturn = [user, privkey];
			resolve(resolveReturn);
		});
	});
}

function saveNewUser(user, privkey){
	return new Promise(function(resolve, reject) {
		User.create(user, function(err, savedUser){
			if(err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			var newCryptoUser = {
				userId: savedUser._id,
				privateKey: privkey,
			}
			CryptoUser.create(newCryptoUser, function(err, cryptoUser){
				if(err){
                    var errorInfo = {
                        status : 500,
                        errorCode : errorCodes.INTERNAL_ERROR,
                        errorKey : "INTERNAL_ERROR"
                    }
    				var error = new CustomError(errorInfo);
    				return reject(error);
				}
				resolve(savedUser);
			});
		});
	});
}
