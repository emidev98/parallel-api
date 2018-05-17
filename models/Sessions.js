var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');

var SessionsSchema = new Schema({
    ip: String,
    location: String,
    browser: String,
    os: String,
    date: Date
}, {collection: "sessions"});

module.exports = conn.model('Session', SessionsSchema);
