var express 	 = require('express');
var User 		 = require('../models/User');
var Account      = require('../models/Account');
var errorCodes   = require('../responses/errorCodes');
var CustomError  = require('../responses/CustomError');

module.exports.createAccount = function(userEmail, account, callback){
    User.find({
        email: userEmail
    }, function (err, user){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        var newAccount = new Account({
            userId: user._id,
            userGroupId: account.userGroupId,
            title: account.title,
            image: account.image,
            description: account.description,
            user: account.user,
            password: account.password
        });
        newAccount.save(function(err, savedAccount){
            if (err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            callback(null, savedAccount);
        })
    })
}
