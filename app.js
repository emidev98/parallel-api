var express         = require('express');
var forceSSL        = require("express-force-ssl");
var bodyParser      = require('body-parser');
var fs              = require("fs");
var cors            = require("cors");
var openpgp         = require("openpgp");
var https           = require('https');
var Middlewares     = require('./middlewares/middlewares');
var db              = require('./db');
var app             = express();

var port = process.env.PORT || 8443; //Create port variable
var corsOptions = {
    cert    : fs.readFileSync("/etc/letsencrypt/live/paralelapi.westeurope.cloudapp.azure.com/fullchain.pem"),
    key     : fs.readFileSync("/etc/letsencrypt/live/paralelapi.westeurope.cloudapp.azure.com/privkey.pem"),
    origin  : '*',
    optionsSuccessStatus: 200
};

var keyOption = {
    userIds: [{name: "paralelSoftware"}],
    curve: "p256"
};
openpgp.generateKey(keyOption).then(function(key){
    var publickey = key.publicKeyArmored;
    var privkey = key.privateKeyArmored;
    fs.writeFileSync("", privkey);
    fs.writeFileSync("", publickey);
});

// Using bodyParser to get json body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Using forceSSL to conect via HTTPS
app.use(forceSSL);
app.use(cors(corsOptions));

// Middlewares
app.use(Middlewares.replaceUrl);
app.use(Middlewares.hasAccess);

// Call routes function
var routes = require('./routes/routes');
routes(app);

// Create httpsServer with credential options and app variable
var httpsServer = https.createServer(corsOptions, app);
httpsServer.listen(port);
console.log('Listening with https by port ' + port);
