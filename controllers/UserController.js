var express = require('express');
// Utilitzem el Router de express per crear les rutes
var router = express.Router();

//Serveix per agafar la info de la peticio de body i fer-la bonica (Middleware)
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

var User = require('../models/User');

router.get('/', function(req, res){
	res.send('Hello world');
});
