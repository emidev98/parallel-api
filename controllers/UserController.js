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
var UserController          = require('./UserController')
const {OAuth2Client}        = require('google-auth-library');
const client                = new OAuth2Client(CLIENT_ID);
const CLIENT_ID             = "380593198822-a1r3c57rnqjfl8vij1chq3u3arlc4kao.apps.googleusercontent.com";


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

module.exports.verifyGoogleAccount = function(token){
    return new Promise(function(resolve, reject){
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        console.log(userid);
        resolve(userid);
    })
}

module.exports.googleSignIn = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
    verify(user.id).then(userid => function(userid){
        console.log(userid);
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
                UserController.createKeyPair(user)
                .then(resolveReturn => UserController.saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
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
    }).catch(console.error);
}

module.exports.register = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
    if(user.password.toString() != user.repeatPassword.toString()){
        return callback(new CustomError(errorCodes.PASSWORD_DO_NOT_MATCH), undefined);
    }
    this.checkNewUserEmail(user)
    .then(user => this.createHash(user))
    .then(user => this.createKeyPair(user))
 	.then(resolveReturn => this.saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
    .then(savedUser => callback(null, savedUser))
    .catch(err => callback(err, undefined))
}

module.exports.login = function (user, callback){
	this.checkUserEmail(user)
		.then(users => this.compareHash(users))
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
        UserController.compareHash(usersForHash)
        .then(userDB => UserController.createHash(newPasswordUser))
        .then(user => UserController.saveNewPassword(userInDb, user.password))
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




    /**********************
    *PROMISES FUNCTIONS****
    **********************/

module.exports.checkNewUserEmail = function(user){
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

module.exports.createHash = function(user){
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

module.exports.createKeyPair = function(user){
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

module.exports.saveNewUser = function(user, privkey){
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

module.exports.checkUserEmail = function(user){
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

module.exports.compareHash = function(users){
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

module.exports.saveNewPassword = function(userInDb, newPassword) {
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
