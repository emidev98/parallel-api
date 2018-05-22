var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var AccountGroup = require('./AccountGroup');
var CustomError  = require('../responses/CustomError');
var conn         = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');

var UsersSchema = new Schema({
    publicKey: {type: String, unique: true},
    token: String,
    firstName: String,
    lastName: String,
    email: {type: String, unique: true},
    age: Number,
    password: String,
    language: {type: String, default: "ES"},
    googleId: String,
    styles: {
        backgroundImage: {type: String, default: ""},
        isGridView: {type: Boolean, default: true},
        image: {type: String, default: ""}
    }
}, { collection : 'users' });

UsersSchema.methods.maxAccountGroupId = function(callback) {
    var max;
    AccountGroup.findOne()
        .where({userId: this._id})
        .sort('-index')
        .exec(function(err, doc)
            {
                if (err){
    				return callback(new CustomError(errorCodes.INTERNAL_ERROR));
                }
                max = doc.index;
                callback(max);
            }
    );
}

module.exports = conn.model('User', UsersSchema);
