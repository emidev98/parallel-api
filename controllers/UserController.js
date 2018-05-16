var express 	= require('express');
var User 		= require('../models/User');
var CryptoUser 	= require('../models/CryptoUser');
var bcrypt  	= require('bcrypt');
var openpgp 	= require('openpgp');
var CustomError = require('../errors/CustomError');
var errorCodes  = require('../errors/errorCodes');
openpgp.initWorker({ path:'openpgp.worker.js' });
var saltRounds = 10;

module.exports.register = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
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
            console.log(hash);
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
			user.publickey = key.publicKeyArmored;
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
				userid: savedUser._id,
				privatekey: privkey,
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


module.exports.login = function (user, callback){
	checkUserEmail(user)
		.then(users => compareHash(users))
		.then(userDB => callback(null, userDB))
		.catch(err => callback(err, undefined))
}

function checkUserEmail(user){
	return new Promise(function (resolve, reject){
		var userDB = User.findOne({
			email: user.email
		}, function (err, userDB){
            if(err) {
                console.log(err);
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			if (!userDB){
				var error = {
					status: 404,
					errorCode: errorCodes.INVALID_USER_OR_PASSWORD,
					errorKey: "INVALID_USER_OR_PASSWORD"
				};
				var userNotFoundError = new CustomError(error);
				return reject(userNotFoundError);
			}
			var users = [user, userDB];
			resolve(users);
		})
	})
}

function compareHash(users){
	var USER_FRONT_END = 0;
	var USER_DB = 1;
	return new Promise(function (resolve, reject){
        bcrypt.compare(users[USER_FRONT_END].password + users[USER_FRONT_END].email.split("@", 1)[0], users[USER_DB].password, function(err, res) {
            if(err) {
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			if (!res){
                console.log(res);
				var error = {
					status: 404,
					errorCode: errorCodes.INVALID_USER_OR_PASSWORD,
					errorKey: "INVALID_USER_OR_PASSWORD"
				};
				var passwordNotMatchError = new CustomError(error);
				return reject(passwordNotMatchError);
			}
            console.log("Before resolve");
			resolve(users[USER_DB]);
		});
    })
}
