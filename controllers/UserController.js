var express 	= require('express');
var User 		= require('../models/User');
var CryptoUser 	= require('../models/CryptoUser');
var bcrypt  	= require('bcrypt');
var openpgp 	= require('openpgp');

var saltRounds = 10;

// module.exports.register = function(user, callback){
// 	User.find({
// 		email: user.email;
// 	}, function(err, users){	//<-- DONE
// 		if(users.length > 0){
// 			//TODO: S'ha de mirar de fer-ho millor
// 			var err = new Error();
// 			err.status = 500;
// 			err.message = "This user alredy exists";
// 			callback(err, undefined);
// 		} else {
// 			var plainHash = user.password + user.email.split("@", 1)[0];
// 			bcrypt.hash(plainHash, saltRounds).then(function(hash)){ //<-- DONE
// 				user.password = hash;
// 				var keyOption = {
// 					userIds = [{name: user.firstName, email: user.email}],
// 					passphrase = user.password,
// 					numBits: 4096
// 				};
// 				openpgp.generateKey(keyOptions).then(function(key){ //<--
// 					var privkey = key.privateKeyArmored;
// 					user.publickey = key.publicKeyArmored;
// 					User.create(user, function(err, user){
// 						if(err) callback(err, user);
// 					});
// 				});
// 			});
// 		}
// 	});
// }

module.exports.register = function(user, callback){
	checkNewUserEmail(user)
	.then(createHash(user)
		.then(createKeyPair(user)
			.then(privkey => saveNewUser(user, privkey)
				.then(savedUser => callback(null, savedUser))
			)
		)
	)
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
			resolve();
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
			resolve();
		});
	});
}

function createKeyPair(user){
	return new Promise(function(resolve, reject) {
		var keyOption = {
			userIds = [{name: user.firstName, email: user.email}],
			passphrase = user.password,
			numBits: 4096
		};
		openpgp.generateKey(keyOption).then(function(key){
			user.publickey = key.publicKeyArmored;
			var privkey = key.privateKeyArmored;
			resolve(privkey);
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
			CryptoUser.create(newCryptoUser, function(err, cryptoUser)){
				if(err){
					return reject(err);
				}
				resolve(savedUser);
			}
		});
	});
}
