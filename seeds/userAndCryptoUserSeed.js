var User = require('../models/User');
var AccountGroup = require('../models/AccountGroup');
var Account = require('../models/Account');
var Session = require('../models/Session');
var CryptoUser = require('../models/CryptoUser');

var user = new User(
    {
        publicKey: 2,
        image: "",
        firstName: "test",
        lastName: "test2",
        email: "test@test.test",
        password:"testpasswd",
        language: "javascript",
    }
);

user.save(function (err, user) {
    if (err) return console.error(err);
    console.log("guardat");
});

var millisecondsToWait = 1000;
setTimeout(function() {
    User.findOne({email: "test@test.test"},function (err, user2) {
      if (err) return console.error(err);
      var accountGroup = new AccountGroup (
          {
              userGroupId: 1,
              userId: user2._id,
              image: "",
              name: "accountGroupTest",
          }
      );
      accountGroup.save(function (err, accountGroup) {
          if (err) return console.error(err);
            console.log("guardat group");
      });
      var account = new Account(
          {
              userGroupId: 1,
              userId: user2._id,
              title: "Facebook",
              image: "test",
              description: "descriptiontest",
              user: "facebookUser",
              password: "ThisIsMyPassword"
          }
      );
      account.save(function (err, account) {
          if (err) return console.error(err);
            console.log("guardat account");
      });
      var account2 = new Account(
          {
              userGroupId: 1,
              userId: user2._id,
              title: "Facebook",
              image: "test",
              description: "descriptiontest",
              user: "facebookUser",
              password: "ThisIsMyPassword"
          }
      );
      account2.save(function (err, account2) {
          if (err) return console.error(err);
            console.log("guardat account2");
      });
      var accountGroup2 = new AccountGroup(
          {
              userGroupId: 2,
              userId: user2._id,
              image: "",
              name: "accountGroupTest",
          }
      );
      accountGroup2.save(function (err, accountGroup2) {
          if (err) return console.error(err);
            console.log("guardat group2");
      });
      var account3 = new Account(
          {
              userGroupId: 2,
              userId: user2._id,
              title: "Facebook",
              image: "test",
              description: "descriptiontest",
              user: "facebookUser",
              password: "ThisIsMyPassword"
          }
      );
      account3.save(function (err, account3) {
          if (err) return console.error(err);
            console.log("guardat account3");
      });
      var session = new Session({
          userId: user2._id,
          ip: "192.168.1.1",
          location: "Somewhere",
          browser: "shitfox",
          os: "win",
      });
      session.save(function (err, session) {
          if (err) return console.error(err);
            console.log("guardat session");
      });
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
