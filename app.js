var express = require('express');
var bodyParser = require("body-parser");
var cors = require("cors");
var app = express();


var corsOptions = {
  origin: 'http://localhost:4200',
  optionsSuccessStatus: 200
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.route('/api/v1/helloworld').get((req, res) => {
    res.send({
        type : "Hello",
        to   : "World",
    });
});

app.listen(3000,function() {
    console.log("API Running on port 3000");
});
