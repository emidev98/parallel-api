var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersTable:ParalelUsersDbRandW@localhost/users?authSource=users');

var AccountsSchema = new Schema({
    _id: Number,
    title: String,
    image: String,
    description: String,
    user: String,
    password: String
});

var AccountGroupsSchema = new Schema({
    _id: Number,
    image: String,
    name: {type: String, unique: true},
    accounts: [AccountsSchema]
});

var SessionsSchema = new Schema({
    ip: String,
    location: String,
    browser: String,
    os: String,
    date: Date
})

var UsersSchema = new Schema({
    publickey: {type: String, unique: true},
    image: String,
    name: String,
    lastname: String,
    email: {type: String, unique: true},
    password: String,
    language: {type: String, default: "ES"},
    accountgroups: [AccountGroupsSchema],
    sessions: [SessionsSchema]
}, { collection :  'users' });

UsersSchema.methods.maxAccountGrpId = function(){
    return this.accountgroups.length + 1;
}

UsersSchema.methods.maxAccountId = function(accountGrpId) {
    return this.accountgroups[accountGrpId - 1].accounts.length;
}

module.exports = conn.model('User', UsersSchema);
