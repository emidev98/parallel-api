var express = require('express');
var User 	= require('../models/User');
var errorCodes = require('../errors/errorCodes');
var CustomError = require('../errors/CustomError');

/*module.exports.login = function(user, callback){
	var userDB = User.findOne({
		email: user.email
	}, function (err, userDB){
		if (err) callback(err, undefined);
		if (!userDB){
			var userNotFoundError = new Error();
			userNotFoundError.status = 404;
			userNotFoundError.message = "The email is not registered!";
			callback(userNotFoundError, undefined);
		}
		bcrypt.compare(user.password, userDB.password, function(err, res) {
			if (err) callback(err, undefined);
			if (!res){
				var passwordNotMatchError = new Error();
				passwordNotMatchError.status = 404;
				passwordNotMatchError.message = "The password doesn't match!";
				callback(passwordNotMatchError, undefined);
			} else {
				var returnUser = {
					token: userDB._id,
					language: userDB.language,
					email: userDB.email,
					firstname: userDB.firstname,
					lastname: userDB.lastname
				}
				callback(null, returnUser);
			}
		});
	});
}*/

module.exports.login = function (user, callback){
	console.log(user.email);
	checkUserEmail(user)
		.then(users => compareHash(users))
		.then(userDB => createUserResponse(userDB))
		.then(userDB => callback(null, userDB))
		.catch(err => callback(err, undefined))
}

function checkUserEmail(user){
	return new Promise(function (resolve, reject){
		var userDB = User.findOne({
			email: user.email
		}, function (err, userDB){
			if (err) callback(err, undefined);
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
		bcrypt.compare(users[USER_FRONT_END].password, users[USER_DB].password, function(err, res) {
			if (err) callback(err, undefined);
			if (!res){
				var error = {
					status: 404,
					errorCode: errorCodes.INVALID_USER_OR_PASSWORD,
					errorKey: "INVALID_USER_OR_PASSWORD"
				};
				var passwordNotMatchError = new CustomError(error);
				return reject(passwordNotMatchError);
			}
			resolve(users[USER_DB]);
		})
	})
}
