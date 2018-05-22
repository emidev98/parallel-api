var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');
var ObjectId  = mongoose.Schema.Types.ObjectId;

var AccountsSchema = new Schema({
    userId: ObjectId,
    groupId: Number,
    name: String,
    image: String,
    description: String,
    user: String,
    password: String,
    index: Number
}, {collection: "accounts"});

module.exports = conn.model('Account', AccountsSchema);
