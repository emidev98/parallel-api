var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');
var ObjectId  = mongoose.Schema.Types.ObjectId;

var AccountsSchema = new Schema({
    userId: ObjectId,
    groupId: Number,
    name: String,
    description: String,
    user: String,
    password: String,
    index: Number,
    image: {
        imageUrl: {type: String, default: ""},
        imageDomain: {type: String, default: ""},
        imageName: {type: String, default: ""},
    },
}, {collection: "accounts"});

module.exports = conn.model('Account', AccountsSchema);
