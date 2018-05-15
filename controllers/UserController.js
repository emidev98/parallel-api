var express = require('express');
var User 	= require('../models/User');

module.exports.login = function(user, callback){
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
				callback(null, user);
			}
		});
	});
}
