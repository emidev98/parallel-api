var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;
var conn      = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');

var AccountGroupsSchema = new Schema({
    userGroupId: Number,
    userId: ObjectId,
    image: String,
    name: String
}, {collection: "accountGroups"});

module.exports = conn.model('AccountGroup', AccountGroupsSchema);
