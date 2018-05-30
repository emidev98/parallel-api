var express 	      = require('express');
var openpgp           = require('openpgp');
var User 		      = require('../models/User');
var AccountGroup      = require('../models/AccountGroup');
var errorCodes        = require('../responses/errorCodes');
var CustomError       = require('../responses/CustomError');
var AccountController = require('../controllers/AccountController');

module.exports.createGroup = function(userEmail, group, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        var accountGroup = new AccountGroup();
        var createdAccounts = [];
        var accountsCreated = 0;
        user.maxAccountGroupId(function(max){
            accountGroup.index = max;
            accountGroup.userId = user._id;
            accountGroup.image = group.image;
            accountGroup.name = group.name;
            accountGroup.save(function(err, accountGroupSaved){
                if (err){
                    return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
                }
                accountGroup.accounts.forEach(account => {
                    account.groupId = group.index;
                    AccountController.createAccount(userEmail, account, function(err, savedAccount){
                        if (err){
                            return callback(err, null)
                        }
                        accountsCreated++;
                        createdAccounts.push(savedAccount);
                        if (accountsCreated.length == accountGroup.accounts.length){
                            accountGroupSaved.accounts = accountsCreated;
                            return callback(null, accountGroupSaved);
                        }
                    })
                })
            });
        });
    });
}

module.exports.modifyGroup = function(groupId, groupInfo, callback){
    AccountGroup.findOne({
        _id: groupId
    }, function(err, group){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!group){
            return callback(new CustomError(errorCodes.GROUP_NOT_FOUND), undefined);
        }
        if (groupInfo.name)
            group.name = groupInfo.name;
        if (groupInfo.image)
            group.image = groupInfo.image;
        group.save(function(err, groupSaved){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
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
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!group){
            return callback(new CustomError(errorCodes.GROUP_NOT_FOUND), undefined);
        }
        resGroup = group;
        AccountController.deleteAccountsOnGroup(group)
        .then(group => {
            group.remove(function(err){
                if (err){
                    return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
                }
                return callback(null, resGroup);
            })
        })
    })
}

module.exports.findOneGroup = function(groupId, callback){
    AccountGroup.findOne({
        _id: groupId
    }, function(err, group){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!group){
            return callback(new CustomError(errorCodes.GROUP_NOT_FOUND), undefined);
        }
        callback(null, group);
    })
}

module.exports.findAll = function(userEmail, callback){
    User.findOne({
        email: userEmail
    }, function(err, user){
        if (err){
            return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
        }
        if (!user){
            return callback(new CustomError(errorCodes.USER_NOT_FOUND), undefined);
        }
        AccountGroup.find({
            userId: user._id
        }, function(err, groups){
            if (err){
                return callback(new CustomError(errorCodes.INTERNAL_ERROR), undefined);
            }
            callback(null, groups);
        })
    })
}
