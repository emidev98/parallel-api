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
    name: String,
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
    publicKey: {type: String, unique: true},
    token: String,
    image: String,
    firstName: String,
    lastName: String,
    email: {type: String, unique: true},
    age: Number,
    password: String,
    language: {type: String, default: "ES"},
    accountGroups: [AccountGroupsSchema],
    sessions: [SessionsSchema]
}, { collection :  'users' });

UsersSchema.methods.maxAccountGrpId = function(){
    return this.accountgroups.length + 1;
}

UsersSchema.methods.maxAccountId = function(accountGrpId) {
    return this.accountgroups[accountGrpId - 1].accounts.length;
}

module.exports = conn.model('User', UsersSchema);
