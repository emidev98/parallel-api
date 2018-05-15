var express 	= require('express');
var User 		= require('../models/User');
var CryptoUser 	= require('../models/CryptoUser');
var bcrypt  	= require('bcrypt');
var openpgp 	= require('openpgp');
openpgp.initWorker({ path:'openpgp.worker.js' });
var saltRounds = 10;

module.exports.register = function(user, callback){
    var USER = 0;
    var PRIVKEY = 1;
    checkNewUserEmail(user)
    .then(user => createHash(user))
    .then(user => createKeyPair(user))
 	.then(resolveReturn => saveNewUser(resolveReturn[USER], resolveReturn[PRIVKEY]))
    .then(savedUser => callback(null, savedUser))
    .catch(err => callback(err, undefined))
}

function checkNewUserEmail(user){
	return new Promise(function(resolve, reject) {
		User.find({
			email: user.email
		}, function(err, users){
			if(err) {
				return reject(err);
			}
			if(users.length > 0){
				//TODO: S'ha de mirar de fer-ho millor
				var userFindError = new Error();
				userFindError.status = 500;
				userFindError.message = "This user alredy exists";
				return reject(userFindError);
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
				return reject(err);
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
			passphrase: user.password,
			curve: "p256"
		};
		openpgp.generateKey(keyOption).then(function(key){
			user.publickey = key.publicKeyArmored;
			var privkey = key.privateKeyArmored;
            var resolveReturn = [user, privkey];
			resolve(resolveReturn);
		});
	});
}

function saveNewUser(user, privkey){
	return new Promise(function(resolve, reject) {
		User.create(user, function(err, savedUser){
			if(err){
				return reject(err);
			}
			var newCryptoUser = {
				userid: savedUser._id,
				privatekey: privkey,
			}
			CryptoUser.create(newCryptoUser, function(err, cryptoUser){
				if(err){
					return reject(err);
				}
				resolve(savedUser);
			});
		});
	});
}
