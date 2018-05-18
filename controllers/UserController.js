var express 	 = require('express');
var User 		 = require('../models/User');
var CryptoUser 	 = require('../models/CryptoUser');
var bcrypt  	 = require('bcrypt');
var openpgp 	 = require('openpgp');
var CustomError  = require('../errors/CustomError');
var errorCodes   = require('../errors/errorCodes');
var fs           = require("fs");
var randtoken    = require('rand-token');
var AccountGroup = require('AccountGroup');
var saltRounds   = 10;

// Get pair key to encrypt and decrypt private keys
var privatekey  = "";
var publickey   = "";
fs.readFile("/home/paralel/paralelAPI/key.pem", function(err, data){
    privatekey = data.toString();
    privatekey = openpgp.key.readArmored(privatekey).keys[0];
});
fs.readFile("/home/paralel/paralelAPI/public.pem", function(err, data){
    publickey = data.toString();
    publickey = openpgp.key.readArmored(publickey);
});


openpgp.initWorker({ path:'openpgp.worker.js' });

module.exports.isLogged = function(tokenString, emailString, callback){
    User.findOne({
        token: tokenString,
        email: emailString
    }, function(err, user){
        if(err) {
            console.log(err)
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        if(user === null){
            console.log(err)
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INCORRECT_TOKEN,
                errorKey : "ERRORS.INCORRECT_TOKEN"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
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
            errorCode : errorCodes.PASSWORD_DO_NOT_MATCH,
            errorKey : "ERRORS.PASSWORD_DO_NOT_MATCH"
        }
        var error = new CustomError(errorInfo);
        return callback(error, undefined);
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
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			if(users.length > 0){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.DUPLICATED_USER,
                    errorKey : "ERRORS.DUPLICATED_USER"
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
                    errorKey : "ERRORS.INTERNAL_ERROR"
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
			curve: "p256"
		};
		openpgp.generateKey(keyOption).then(function(key){
			user.publicKey = key.publicKeyArmored;
			var privkey = key.privateKeyArmored;
            var encryptionOptions = {
                data: privkey,
                publicKeys: publickey.keys
            };
            openpgp.encrypt(encryptionOptions).then(function(ciphertext){
                var privkeyencrypted = ciphertext.data;
                var resolveReturn = [user, privkeyencrypted];
                resolve(resolveReturn);
            });
		}).catch(function(err){
            console.log(err);
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
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
            savedUser.token = randtoken.generate(16);
            savedUser.save(function(err, savedUserWithToken) {
                if(err){
                    var errorInfo = {
                        status : 500,
                        errorCode : errorCodes.INTERNAL_ERROR,
                        errorKey : "ERRORS.INTERNAL_ERROR"
                    }
    				var error = new CustomError(errorInfo);
    				return reject(error);
    			}
                var defaultAccountGroup = new AccountGroup({
                    userGroupId: -1,
                    userId: savedUser._id,
                    image: "",
                    name: "Accounts"
                });
                defaultAccountGroup.save(function(err, accountGroup){
                    if (err){
                        var errorInfo = {
                            status : 500,
                            errorCode : errorCodes.INTERNAL_ERROR,
                            errorKey : "ERRORS.INTERNAL_ERROR"
                        }
        				var error = new CustomError(errorInfo);
        				return reject(error);
                    }
                });
                var newCryptoUser = {
    				userId: savedUser._id,
    				privateKey: privkey,
    			}
    			CryptoUser.create(newCryptoUser, function(err, cryptoUser){
    				if(err){
                        var errorInfo = {
                            status : 500,
                            errorCode : errorCodes.INTERNAL_ERROR,
                            errorKey : "ERRORS.INTERNAL_ERROR"
                        }
        				var error = new CustomError(errorInfo);
        				return reject(error);
    				}
    				resolve(savedUser);
    			});
            })
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
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			if (!userDB){
				var error = {
					status: 404,
					errorCode: errorCodes.INCORRECT_USER_OR_PASSWORD,
					errorKey: "ERRORS.INCORRECT_USER_OR_PASSWORD"
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
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
				var error = new CustomError(errorInfo);
				return reject(error);
			}
			if (!res){
                console.log(res);
				var error = {
					status: 404,
					errorCode: errorCodes.INCORRECT_USER_OR_PASSWORD,
					errorKey: "ERRORS.INCORRECT_USER_OR_PASSWORD"
				};
				var passwordNotMatchError = new CustomError(error);
				return reject(passwordNotMatchError);
			}
            console.log("Before resolve");
			resolve(users[USER_DB]);
		});
    })
}
