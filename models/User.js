var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;
var AccountGroup = require('./AccountGroup');
var conn         = mongoose.createConnection('mongodb://readerWritterUsersDb:ParalelUsersDbRandW@localhost/users?authSource=users');

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
}, { collection : 'users' });

UsersSchema.methods.maxAccountGroupId = function(callback) {
    var max;
    AccountGroup.findOne()
        .where({userId: this._id})
        .sort('-userGroupId')
        .exec(function(err, doc)
            {
                if (err){
                    var errorInfo = {
                        status : 500,
                        errorCode : errorCodes.INTERNAL_ERROR,
                        errorKey : "ERRORS.INTERNAL_ERROR"
                    }
    				var error = new CustomError(errorInfo);
    				return callback(error);
                }
                max = doc.userGroupId;
                callback(max);
            }
    );
}

module.exports = conn.model('User', UsersSchema);
