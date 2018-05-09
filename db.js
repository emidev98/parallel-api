// db.js

//Agafem el mongosee per utilitzar-lo
var mongoose = require('mongoose');

//Ens conactem a la BD, en aquest cas està hostejada a mLab
mongoose.connect('mongodb://localhost/helloworld')
