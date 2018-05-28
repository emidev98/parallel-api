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
var UserController          = require('./UserController');
var sgMail                  = require('@sendgrid/mail');
var GroupController         = require('../controllers/GroupsController')

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
    .then(savedUser => this.sendMail(savedUser))
    .then(savedUser => callback(null, savedUser))
    .catch(err => callback(err, undefined))
}

module.exports.login = function (user, callback){
	this.checkUserEmail(user)
        .then(users => this.checkEmailConfirmed(users))
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
            if (user.styles.image)
                userDb.styles.image = user.styles.image;
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
        GroupController.findAll(resUser.email, function(err, groups){
            if(err){
                return callback(err, undefined);
            }
            var groupsProcessed = 0;
            groups.forEach(group => {
                GroupController.deleteGroup(group._id, function(err, resGroup){
                    if(err){
                        return callback(err, undefined);
                    }
                    groupsProcessed++;
                    if(groupsProcessed === groups.length){
                        user.remove(function(err){
                            if (err){
                                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
                            }
                            return callback(null, resUser);
                        })
                    }
                })
            });
        })
    })
}

module.exports.confirmEmail = function(userId, callback){
    if (userId.length != 24){
        return callback(new CustomError(errorCodes.INCORRECT_REQUEST), undefined);
    }
    User.findOne({
        _id: userId
    }, function(err, user){
        if (err){
            console.log(err);
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        if (user.emailConfirmed){
            return callback(new CustomError(errorCodes.EMAIL_ALLREADY_CONFIRMED), undefined);
        }
        user.emailConfirmed = true;
        user.save(function(err, userSaved){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            callback(null, userSaved);
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
}

module.exports.sendMail = function(user){
    return new Promise(function(resolve, reject){
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to: user.email,
          from: 'no-reply@paralel.cf',
          subject: 'Email de confirmación',
          text: 'Buenos dias Sr./Sra. ' + user.firstName + ' ' + user.lastName + '. Le informamos que para poder usar la aplicación de Paralel necesitamos que confirmes tu dirección de email, haciendo click en el siguiente botón.',
          html: '<div style="font-size: 16px;">Buenos dias Sr./Sra. ' + user.firstName + ' ' + user.lastName + '.<br>Le informamos que para poder usar la aplicación de Paralel necesitamos que confirmes tu dirección de email, haciendo click en el siguiente botón. <br><br><a href="https://paralel.cf/confirm-account/' + user._id + '" style="display: grid; padding: 1em; background-color: #3f51b5; margin-top: 0.5em; color: white; text-decoration: none; align-items: center; width: 125px; text-align: center;">Confirmar Email</a></div>',
        };
        sgMail.send(msg);
        resolve(user);
    })
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

module.exports.checkEmailConfirmed = function(users){
    var USER_DB = 1;
    var user = users[USER_DB];
    return new Promise(function(resolve, reject){
        if (!user.emailConfirmed){
            return reject(new CustomError(errorCodes.EMAIL_NOT_CONFIRMED))
        }
        resolve(users)
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
