const express = require('express');
const endpoint = express();

endpoint.get('/', function(req, res){
    res.send('Hello World!');
});

endpoint.listen(3000);
