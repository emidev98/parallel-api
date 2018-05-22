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
            console.log(err)
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if(user === null){
            return callback(new CustomError(errorCodes.INCORRECT_TOKEN), undefined);
        }
        console.log("User is logged");
        callback(null, user);
    })
}

module.exports.googleSignIn = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
    User.findOne({
        email: user.email
    }, function(err, dbUser) {
        if(err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if(!dbUser){
            console.log(user);
            user.googleId = user.id;
            user.styles = {
                image : user.image
            }
            createKeyPair(user)
            .then(resolveReturn => saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
            .then(savedUser => callback(null, savedUser))
            .catch(err => callback(err, undefined))
        } else {
            User.findOne({
                _id : user.id
            }, function(err, idValidatedUser){
                if(err){
                    return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
                }
                if(!idValidatedUser){
    				return callback(new CustomError(errorCodes.DUPLICATED_USER), undefined);
                }
                callback(null, dbUser);
            })
        }
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
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
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
        if (!userDb){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
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
        if (user.styles){
            if (user.styles.backgroundImage)
                userDb.styles.backgroundImage = user.styles.backgroundImage;
            if (user.styles.isGridView)
                userDb.styles.isGridView = user.styles.isGridView;
        }

        userDb.save(function(err, userSaved){
            if(err) {
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            callback(null, userSaved);
        })
    })
}



module.exports.changePassword = function(requestBody, userId, callback){
    console.log("Im changind hash");
    var oldPassword = requestBody.actualPassword;
    var oldPasswordRepeat = requestBody.actualPasswordRepeat;
    if(oldPassword != oldPasswordRepeat){
        return callback(new CustomError(errorCodes.PASSWORD_DO_NOT_MATCH), undefined);
    }
    User.findOne({
        email: requestBody.email,
        _id: userId
    }, function(err, userInDb){
        if(err) {
            console.log(err);
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        var oldPasswordUser = {
            email: requestBody.email,
            password: requestBody.actualPassword,
        }
        var newPasswordUser = {
            email: requestBody.email,
            password: requestBody.newPassword
        }
        var usersForHash = [oldPasswordUser, userInDb];
        compareHash(usersForHash)
        .then(userDB => createHash(newPasswordUser))
        .then(user => saveNewPassword(userInDb, user.password))
        .then(userSaved => callback(null, userSaved))
        .catch(err => callback(err, undefined))
    })
}

module.exports.deleteUser = function(userId, callback){
    var resUser;
    User.findOne({
        _id: userId
    }, function(err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
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
    console.log("Im creating hash");
	return new Promise(function(resolve, reject) {
		var plainHash = user.password + user.email.split("@", 1)[0];
		bcrypt.hash(plainHash, saltRounds, function(err, hash){
			if(err){
                console.log(err);
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
        user.styles = {
            backgroundImage : "",
            isGridView : true,
            image : "",
        };
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
		User.findOne({
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
    console.log(users)
    console.log("Im comparing hash");
	var USER_FRONT_END = 0;
	var USER_DB = 1;
	return new Promise(function (resolve, reject){
        bcrypt.compare(users[USER_FRONT_END].password + users[USER_FRONT_END].email.split("@", 1)[0], users[USER_DB].password, function(err, res) {
            if(err) {
                console.log(err);
				return reject(new CustomError(errorCodes.INTERNAL_ERROR));
			}
			if (!res){
				return reject(new CustomError(errorCodes.INCORRECT_USER_OR_PASSWORD));
			}
			resolve(users[USER_DB]);
		});
    })
}

function saveNewPassword(userInDb, newPassword) {
    console.log("Im saving user hash");
    return new Promise(function(resolve, reject){
        userInDb.password = newPassword;
        userInDb.save(function(err, userSaved){
            if(err){
                console.log(err);
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            console.log("This is new user saved changed password: "+userSaved);
            resolve(userSaved);
        })
    })
}
