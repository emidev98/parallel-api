var User = require('../models/User');
var CryptoUser = require('../model/CryptoUser');

var user = new User(
    {
        publickey: 3,
        image: "",
        name: "test",
        lastname: "test2",
        email: "test@test.test",
        password:"testpasswd",
        language: "javascript",
        accountgroups:
            [{
                _id: 1,
                image: "",
                name: "accountGroupTest",
                accounts:
                    [{
                        _id: 1,
                        title: "Facebook",
                        image: "test",
                        description: "descriptiontest",
                        user: "facebookUser",
                        password: "ThisIsMyPassword"
                    }]
            },
            {
                _id: 2,
                image: "",
                name: "accountGroupTest",
                accounts:
                    [{
                        _id: 1,
                        title: "Facebook",
                        image: "test",
                        description: "descriptiontest",
                        user: "facebookUser",
                        password: "ThisIsMyPassword"
                    }]
            }]
    }
);

user.save(function (err, user) {
    if (err) return console.error(err);
    console.log("guardat");
});

/*var millisecondsToWait = 500;
setTimeout(function() {
    User.findOne({email: "test@test.test"},function (err, user2) {
      if (err) return console.error(err);
      var cryptoUser = new CryptoUser({
          userid: user2._id,
          privatekey: "thisisnotprivatekey"
      });
      cryptoUser.save(function (err, cryptoUser) {
          if (err) return console.error(err);
            console.log("guardat crypto");
      });
    });
}, millisecondsToWait);
