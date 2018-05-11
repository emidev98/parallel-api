var express = require('express');
var User 	= require('../models/User');


router.get('/', function(req, res){
	res.send('Hello world');
});
