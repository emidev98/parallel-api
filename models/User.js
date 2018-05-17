var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');

var UsersSchema = new Schema({
    publicKey: {type: String, unique: true},
    token: String,
    image: String,
    firstName: String,
    lastName: String,
    email: {type: String, unique: true},
    age: Number,
    password: String,
    language: {type: String, default: "ES"},
}, { collection :  'users' });

UsersSchema.methods.maxAccountGrpId = function(){
    return this.accountgroups.length + 1;
}

UsersSchema.methods.maxAccountId = function(accountGrpId) {
    return this.accountgroups[accountGrpId - 1].accounts.length;
}

module.exports = conn.model('User', UsersSchema);
