var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');
var ObjectId  = mongoose.Schema.Types.ObjectId;

var AccountGroupsSchema = new Schema({
    index: Number,
    userId: ObjectId,
    name: String,
    image: {
        imageUrl: String,
        imageDomain: String,
        imageName: String,
    },
}, {collection: "accountgroups"});

module.exports = conn.model('AccountGroup', AccountGroupsSchema);
