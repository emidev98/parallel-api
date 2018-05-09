// User.js
var mongoose = require('mongoose');

// Creem un schema (blueprint) per representar el usuari de la BD.
var UserSchema = new mongoose.Schema({
    hello: String,
    world: String,
}, { collection : 'helloworld' });

// Conectem el model de User amb el schema que hem creat
mongoose.model('HelloWorld', UserSchema);

//Exportem el model perque sigui visible
module.exports = mongoose.model('HelloWorld');
