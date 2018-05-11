var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;
var conn2     = mongoose.createConnection('mongodb://localhost/testB');

var CryptoUsersSchema = new Schema({
    userid: ObjectId,
    privatekey: String,
},{collection: "cryptousers"})

module.exports = conn2.model('CryptoUser', CryptoUsersSchema);
