var express 	= require('express');
var openpgp 	= require('openpgp');
var fs          = require("fs");
var CryptoUser 	= require('../models/CryptoUser');

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
                    var errorInfo = {
                        status : 500,
                        errorCode : errorCodes.INTERNAL_ERROR,
                        errorKey : "ERRORS.INTERNAL_ERROR"
                    }
                    var error = new CustomError(errorInfo);
                    return reject(error);
                }
                resolve(cryptoUser);
            });
        });
    });
}
