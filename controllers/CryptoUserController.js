var express 	= require('express');
var openpgp 	= require('openpgp');
var fs          = require("fs");
var CryptoUser 	= require('../models/CryptoUser');
var CustomError = require('../responses/CustomError');
var errorCodes  = require('../responses/errorCodes');

var privatekey  = "";
var publickey   = "";

fs.readFile("/home/paralel/paralelAPI/key.pem", function(err, data){
    privatekey = data.toString();
    privatekey = openpgp.key.readArmored(privatekey).keys[0];
});
fs.readFile("/home/paralel/paralelAPI/public.pem", function(err, data){
    publickey = data.toString();
    publickey = openpgp.key.readArmored(publickey);
});

openpgp.initWorker({ path:'openpgp.worker.js' });

module.exports.saveCryptoUser = function(newCryptoUser){
    return new Promise(function(resolve, reject) {
        var encryptionOptions = {
            data: newCryptoUser.privateKey,
            publicKeys: publickey.keys
        };
        openpgp.encrypt(encryptionOptions).then(function(ciphertext){
            var privkeyencrypted = ciphertext.data;
            newCryptoUser.privateKey = privkeyencrypted;
            CryptoUser.create(newCryptoUser, function(err, cryptoUser){
                if(err){
                    return reject(new CustomError(errorCodes.INTERNAL_ERROR));
                }
                resolve(cryptoUser);
            });
        });
    });
}

module.exports.getPrivateKey = function(userId){
    return new Promise(function(resolve, reject) {
        CryptoUser.findOne({
            userId: userId
        }, function(err, privKey){
            if(err){
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            if (!privKey){
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            decryptOptions = {
                message: openpgp.message.readArmored(privKey.privateKey),
                privateKeys: [privatekey]
            }
            openpgp.decrypt(decryptOptions).then(function(plaintext) {
                return resolve(plaintext.data)
            }).catch(function(err) {
                return reject(err);
            });
        });
    });
}

module.exports.deletePrivateKey = function(deletedUserId){
    return new Promise(function(resolve, reject){
        CryptoUser.deleteOne({
            userId: deletedUserId
        }, function(err, deletedPrivKey){
            if(err){
                return reject(new CustomError(errorCodes.INTERNAL_ERROR));
            }
            resolve();
        })
    })
}
