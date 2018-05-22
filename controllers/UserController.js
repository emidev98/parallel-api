var express 	            = require('express');
var User 		            = require('../models/User');
var bcrypt  	            = require('bcrypt');
var openpgp 	            = require('openpgp');
var CustomError             = require('../responses/CustomError');
var errorCodes              = require('../responses/errorCodes');
var fs                      = require("fs");
var randtoken               = require('rand-token');
var CryptoUserController    = require('./CryptoUserController');
var CryptoUser 	            = require('../models/CryptoUser');
var AccountGroup            = require('../models/AccountGroup');
var mongoose                = require('mongoose');
var saltRounds              = 10;


openpgp.initWorker({ path:'openpgp.worker.js' });

module.exports.isLogged = function(tokenString, emailString, callback){
    User.findOne({
        token: tokenString,
        email: emailString
    }, function(err, user){
        if(err) {
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if(user === null){
            return callback(new CustomError(errorCodes.INCORRECT_TOKEN), undefined);
        }
        else callback(null, user);
    })
}

module.exports.register = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
    if(user.password.toString() != user.repeatPassword.toString()){
        return callback(new CustomError(errorCodes.PASSWORD_DO_NOT_MATCH), undefined);
    }
    checkNewUserEmail(user)
    .then(user => createHash(user))
    .then(user => createKeyPair(user))
 	.then(resolveReturn => saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
    .then(savedUser => callback(null, savedUser))
    .catch(err => callback(err, undefined))
}

module.exports.login = function (user, callback){
	checkUserEmail(user)
		.then(users => compareHash(users))
		.then(userDB => callback(null, userDB))
		.catch(err => callback(err, undefined))
}

module.exports.getUser = function(userId, callback){
    User.findOne({
        _id: userId
    }, function(err, user){
        if(err) {
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.INCORRECT_USER_OR_PASSWORD), undefined);
        }
        callback(null, user)
    })
}

module.exports.modifyUser = function(userId, user, callback){
    User.findOne({
        _id: userId
    }, function(err, userDb){
        if(err) {
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (user.image)
            userDb.image = user.image;
        if (user.firstName)
            userDb.firstName = user.firstName;
        if (user.lastName)
            userDb.lastName = user.lastName;
        if (user.age)
            userDb.age = user.age;
        if (user.email)
            userDb.email = user.email;
        if (user.languages)
            userDb.language = user.language;
        if (user.style){
            if (user.style.backgroundImage)
                userDb.style.backgroundImage = user.style.backgroundImage;
            if (user.style.isGridView)
                userDb.style.isGridView = user.style.isGridView;
        }

        userDb.save(function(err, userSaved){
            if(err) {
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            callback(null, userSaved);
        })
    })
}



/*module.exports.changePassword = function(requestBody, callback){
    var oldPassword = requestBody.actualPassword;
    var oldPasswordRepeat = requestBody.actualPasswordRepeat;
    if(oldPassword != oldPasswordRepeat){
        //TODO: Throw error
    }
    User.findOne({
        email: requestBody.email
    }, function(err, userInDb){
        if(err) {
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        var frontEndUser = {
            email: requestBody.email,
            password: requestBody.password
        }
        var usersForHash = [frontEndUser, userInDb];
        compareHash(usersForHash)
        .then(userDB => createHash(user))
        .catch(err => callback(err, undefined))
    })
}*/

module.exports.deleteUser = function(userId, callback){
    var resUser;
    User.findOne({
        _id: userId
    }, function(err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        resUser = user;
        user.remove(function(err){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            return callback(null, resUser);
        })
    })
}

function checkNewUserEmail(user){
	return new Promise(function(resolve, reject) {
		User.find({
			email: user.email
		}, function(err, users){
			if(err) {
				return reject(new CustomError(errorCodes.INTERNAL_ERROR));
			}
			if(users.length > 0){
				return reject(new CustomError(errorCodes.DUPLICATED_USER));
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
				return reject(new CustomError(errorCodes.INTERNAL_ERROR));
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
			curve: "p256"
		};
        console.log(keyOption.userIds);
		openpgp.generateKey(keyOption).then(function(key){
			user.publicKey = key.publicKeyArmored;
			var privkey = key.privateKeyArmored;
            var resolveReturn = [user, privkey];
            resolve(resolveReturn);
		}).catch(function(err){
            reject(err);
        });
	});
}

function saveNewUser(user, privkey){
	return new Promise(function(resolve, reject) {
        user.token = randtoken.generate(16);
		User.create(user, function(err, savedUser){
			if(err){
				return reject(new CustomError(errorCodes.INTERNAL_ERROR));
			}
            var defaultAccountGroup = new AccountGroup({
                index: -1,
                userId: savedUser._id,
                image: "",
                name: "Accounts"
            });
            defaultAccountGroup.save(function(err, accountGroup){
                if (err){
                    return reject(new CustomError(errorCodes.INTERNAL_ERROR));
                }
                var newCryptoUser = {
    				userId: savedUser._id,
    				privateKey: privkey,
    			}
                CryptoUserController.saveCryptoUser(newCryptoUser)
                .then(function(cryptoUser){
                    return resolve(savedUser);
                }).catch(function(error){
                    return reject(error);
                });
            });
		});
	});
}

function checkUserEmail(user){
	return new Promise(function (resolve, reject){
		var userDB = User.findOne({
			email: user.email
		}, function (err, userDB){
            if(err) {
				return reject(new CustomError(errorCodes.INTERNAL_ERROR));
			}
			if (!userDB){
				return reject(new CustomError(errorCodes.INCORRECT_USER_OR_PASSWORD));
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
				return reject(new CustomError(errorCodes.INTERNAL_ERROR));
			}
			if (!res){
				return reject(new CustomError(errorCodes.INCORRECT_USER_OR_PASSWORD));
			}
			resolve(users[USER_DB]);
		});
    })
}
