var express = require('express');
var forceSSL = require("express-force-ssl");
var fs = require("fs");
var cors = require("cors");
var https = require('https');
var app = express();
var db = require('./db');
var port = process.env.PORT || 8443;

var corsOptions = {
    cert    : fs.readFileSync("/etc/letsencrypt/live/paralelapi.westeurope.cloudapp.azure.com/fullchain.pem"),
    key     : fs.readFileSync("/etc/letsencrypt/live/paralelapi.westeurope.cloudapp.azure.com/privkey.pem"),
    origin  : '*',
    optionsSuccessStatus: 200
};

var UserController = require('./controllers/UserController');
var HelloWorldController = require('./controllers/HelloWorldController')

app.use(forceSSL);
app.use(cors(corsOptions));

//app.use('/users', UserController);


//Testing
app.use('/api/v1/helloworld', HelloWorldController);

// Create httpsServer with credential options and app variable
var httpsServer = https.createServer(corsOptions, app);
httpsServer.listen(port);
