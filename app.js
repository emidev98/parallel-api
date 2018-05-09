var express = require('express');
var cors = require("cors");
var app = express();
var db = require('./db');
var port = process.env.PORT || 3000;

var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
};

var UserController = require('./controllers/UserController');
var HelloWorldController = require('./controllers/HelloWorldController')

app.use(cors(corsOptions));

//app.use('/users', UserController);


//Testing
app.use('/helloworld', HelloWorldController);

app.listen(port,function() {
    console.log("API Running on port 3000");
});
