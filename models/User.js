// User.js
var mongoose = require('mongoose');

// Creem un schema (blueprint) per representar el usuari de la BD.
var UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

// Conectem el model de User amb el schema que hem creat
mongoose.model('User', UserSchema);

//Exportem el model perque sigui visible
module.exports = mongoose.model('User');
