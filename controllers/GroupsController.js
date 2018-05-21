var express 	 = require('express');
var openpgp      = require('openpgp');
var User 		 = require('../models/User');
var AccountGroup = require('../models/AccountGroup');
var errorCodes   = require('../responses/errorCodes');
var CustomError  = require('../responses/CustomError');

module.exports.createGroup = function(userEmail, group, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        var accountGroup = new AccountGroup();
        user.maxAccountGroupId(function(max){
            accountGroup.userGroupId = max + 1;
            accountGroup.userId = user._id;
            accountGroup.image = group.image;
            accountGroup.name = group.name;
            accountGroup.save(function(err, accountGroupSaved){
                if (err){
                    var errorInfo = {
                        status : 500,
                        errorCode : errorCodes.INTERNAL_ERROR,
                        errorKey : "ERRORS.INTERNAL_ERROR"
                    }
                    var error = new CustomError(errorInfo);
                    return callback(error, undefined);
                }
                callback(null, accountGroupSaved);
            });
        });
    });
}

module.exports.modifyGroup = function(groupId, groupInfo, callback){
    AccountGroup.findOne({
        _id: groupId
    }, function(err, group){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        if (groupInfo.name)
            group.name = groupInfo.name;
        if (groupInfo.image)
            group.image = groupInfo.image;
        group.save(function(err, groupSaved){
            if (err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            callback(null, groupSaved);
        })
    })
}

module.exports.deleteGroup = function(groupId, callback){
    var resGroup;
    AccountGroup.findOne({
        _id: groupId
    }, function(err, group){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        resGroup = group;
        group.remove(function(err){
            if (err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            return callback(null, resGroup);
        })
    })
}

module.exports.findOneGroup = function(groupId, callback){
    AccountGroup.findOne({
        _id: groupId
    }, function(err, group){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        callback(null, group);
    })
}

module.exports.findAll = function(userEmail, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            var errorInfo = {
                status : 500,
                errorCode : errorCodes.INTERNAL_ERROR,
                errorKey : "ERRORS.INTERNAL_ERROR"
            }
            var error = new CustomError(errorInfo);
            return callback(error, undefined);
        }
        AccountGroup.find({
            userId: user._id
        }, function(err, groups){
            if (err){
                var errorInfo = {
                    status : 500,
                    errorCode : errorCodes.INTERNAL_ERROR,
                    errorKey : "ERRORS.INTERNAL_ERROR"
                }
                var error = new CustomError(errorInfo);
                return callback(error, undefined);
            }
            callback(null, groups);
        })
    })
}
