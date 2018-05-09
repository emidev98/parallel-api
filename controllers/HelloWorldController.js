var express = require('express');
// Utilitzem el Router de express per crear les rutes
var router = express.Router();

//Serveix per agafar la info de la peticio de body i fer-la bonica (Middleware)
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

var HelloWorld = require('../models/HelloWorld');

router.get('/', function(req, res){
    HelloWorld.find({}, function (err, users) {
        if(err) return res.status(500).send("There was a problem finding the users.");
        res.status(200).send(users[0]);
    });
});

module.exports = router;
