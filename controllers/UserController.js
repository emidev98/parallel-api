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
var {OAuth2Client}          = require('google-auth-library');
var CLIENT_ID               = "380593198822-jhv13d5pnt19impr1791em8a9rs60o15.apps.googleusercontent.com";
var CLIENT_ID_DEV           = "380593198822-a1r3c57rnqjfl8vij1chq3u3arlc4kao.apps.googleusercontent.com"
var client                  = new OAuth2Client(CLIENT_ID);
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
        callback(null, user);
    })
}

async function verifyGoogleAccount(token, origin){
    var idToken;
    if(origin == "https://paralel.cf"){
        idToken = {
            idToken: token,
            audience: CLIENT_ID,
        }
    } else {
        idToken = {
            idToken: token,
            audience: CLIENT_ID_DEV,
        }
    }
    const ticket = await client.verifyIdToken(idToken);
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    return userid;
}

module.exports.googleSignIn = function(user, origin, callback){
    var USER = 0;
    var PRIVKEY = 1;
    verifyGoogleAccount(user.id, origin).then(userid => {
        User.findOne({
            email: user.email
        }, function(err, dbUser) {
            if(err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            if(!dbUser){
                var newUser = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isGoogle: true,
                    token: userid,
                    emailConfirmed: true,
                };
                UserController.createKeyPair(newUser)
                .then(resolveReturn => UserController.saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
                .then(savedUser => callback(null, savedUser))
                .catch(err => callback(err, undefined))
            } else {
                if(dbUser.isGoogle){
                    return callback(null, dbUser);
                } else {
                    return callback(new CustomError(errorCodes.INCORRECT_TOKEN), undefined);
                }
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
        userDb.firstName = user.firstName;
        userDb.lastName = user.lastName;
        userDb.age = user.age;
        userDb.language = user.language;
        userDb.sendEmails = user.sendEmails;
        userDb.styles.image = user.styles.image;
        userDb.styles.backgroundImage = user.styles.backgroundImage;
        userDb.styles.isGridView = user.styles.isGridView;
        userDb.save(function(err, userSaved){
            if(err) {
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            callback(null, userSaved);
        })
    })
}



module.exports.changePassword = function(requestBody, userId, userEmail, callback){
    var newPassword = requestBody.newPassword;
    var newPasswordRepeat = requestBody.newPasswordRepeat;
    var oldPassword = requestBody.actualPassword;
    if(newPassword != newPasswordRepeat){
        return callback(new CustomError(errorCodes.PASSWORD_DO_NOT_MATCH), undefined);
    }
    User.findOne({
        email: userEmail,
        _id: userId
    }, function(err, userInDb){
        if(err) {
            console.log(err);
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        var oldPasswordUser = {
            email: userEmail,
            password: requestBody.actualPassword,
        }
        var newPasswordUser = {
            email: userEmail,
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
            if(groups.length === 0){
                user.remove(function(err){
                    if (err){
                        return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
                    }
                    return callback(null, resUser);
                })
            } else {
                var groupsProcessed = 0;
                CryptoUserController.deletePrivateKey(resUser._id).then(() => {
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
                }).catch(err => callback(err, undefined))
            }
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

module.exports.sendMailResetPassword = function(userEmail, callback){
    User.findOne({
        email: userEmail
    }, function (err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR))
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND))
        }
        if(user.isGoogle){
            return callback(new CustomError(errorCodes.INCORRECT_REQUEST))
        }
        user.recoveryToken = randtoken.generate(16);
        user.recoveryDate = Date.now();
        user.save(function(err, savedUser){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR))
            }
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
              to: user.email,
              from: 'no-reply@paralel.cf',
              subject: 'Recuperar contraseña',
              text: 'Buenos dias Sr./Sra. ' + user.firstName + ' ' + user.lastName + '. Le informamos que para poder usar la aplicación de Paralel necesitamos que confirmes tu dirección de email, haciendo click en el siguiente botón.',
              html: '<div style="font-size: 16px;">Buenos dias Sr./Sra. ' + user.firstName + ' ' + user.lastName + '.<br>Le informamos de que se ha solicitado un cambio de contraseña para este email, entre en el siguiente link e introduzca el codigo que le dejamos a continuacion: ' + savedUser.recoveryToken + '<br><br><a href="https://paralel.cf/reset-password/" style="display: grid; padding: 1em; background-color: #3f51b5; margin-top: 0.5em; color: white; text-decoration: none; align-items: center; width: 125px; text-align: center;">Cambiar contraseña</a></div>',
            };
            sgMail.send(msg);
            callback(null);
        })
    })
}

module.exports.resetPassword = function(user, callback){
    var TIMEOUT = 600000;
    if (user.token.toString() == ""){
        return callback(new CustomError(errorCodes.INCORRECT_TOKEN), undefined)
    }
    if (user.password.toString() != user.repeatPassword.toString()){
        return callback(new CustomError(errorCodes.PASSWORD_DO_NOT_MATCH), undefined);
    }
    User.findOne({
        recoveryToken: user.token
    }, function(err, userDb){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR))
        }
        if (!userDb){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND))
        }
        if (Date.now() - userDb.recoveryDate > TIMEOUT){
            return callback(new CustomError(errorCodes.TOKEN_HAS_EXPIRED), undefined)
        }
        userDb.password = user.password;
        UserController.createHash(userDb)
        .then(userHashed => UserController.removeToken(userHashed))
        .then(userWithoutToken => UserController.saveNewPassword(userWithoutToken, userWithoutToken.password))
        .then(userSaved => callback(null, userSaved))
        .catch(err => callback(err, undefined))
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
        if(!user.token){
            user.token = randtoken.generate(16);
        }
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
            if(userDB.isGoogle){
                return reject(new CustomError(errorCodes.INCORRECT_REQUEST));
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
    return new Promise(function(resolve, reject){
        userInDb.password = newPassword;
        userInDb.save(function(err, userSaved){
            if(err){
                console.log(err);
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            resolve(userSaved);
        })
    })
}

module.exports.removeToken = function(user){
    return new Promise(function(resolve, reject){
        user.recoveryDate = null;
        user.recoveryToken = "";
        user.save(function(err){
            if (err){
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            resolve(user)
        })
    })
}
