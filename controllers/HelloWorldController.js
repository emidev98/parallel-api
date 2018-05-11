var express     = require('express');
var HelloWorld  = require('../models/HelloWorld');

module.exports.getHelloWorld = function(callback){
    HelloWorld.find({}, callback);
}
