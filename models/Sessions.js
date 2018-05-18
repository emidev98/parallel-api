var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');
var ObjectId  = mongoose.Schema.Types.ObjectId;

var SessionsSchema = new Schema({
    userId: ObjectId,
    ip: String,
    location: String,
    browser: String,
    os: String,
    date: Date
}, {collection: "sessions"});

module.exports = conn.model('Session', SessionsSchema);
