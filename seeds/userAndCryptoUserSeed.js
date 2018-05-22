var User = require('../models/User');
var AccountGroup = require('../models/AccountGroup');
var Account = require('../models/Account');
var Session = require('../models/Session');
var CryptoUser = require('../models/CryptoUser');
var mongoose  = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

/*var user = new User(
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
*/
//var millisecondsToWait = 1000;
//setTimeout(function() {
    User.findOne({email: "test@test.test"},function (err, user2) {
      if (err) return console.error(err);
      var accountGroup = new AccountGroup (
          {
              index: 1,
              userId: ObjectId("5b0444b900f87f1348b55fed")
              image: "https://images.pexels.com/photos/67636/rose-blue-flower-rose-blooms-67636.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
              name: "Default",
          }
      );
      accountGroup.save(function (err, accountGroup) {
          if (err) return console.error(err);
            console.log("guardat group");
      });
      var account = new Account(
          {
              groupId: 1,
              userId: ObjectId("5b0444b900f87f1348b55fed"),
              name: "Facebook",
              image: "https://images.pexels.com/photos/67636/rose-blue-flower-rose-blooms-67636.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
              description: "descriptiontest",
              user: "facebookUser",
              password: "ThisIsMyPassword",
              index: 1
          }
      );
      account.save(function (err, account) {
          if (err) return console.error(err);
            console.log("guardat account");
      });
      var account2 = new Account(
          {
              groupId: 1,
              userId: ObjectId("5b0444b900f87f1348b55fed"),
              name: "Twitter",
              image: "http://kb4images.com/images/image/37185176-image.jpg",
              description: "descriptiontest",
              user: "facebookUser3",
              password: "ThisIsMyPassword3",
              index: 2
          }
      );
      account2.save(function (err, account2) {
          if (err) return console.error(err);
            console.log("guardat account2");
      });
      var accountGroup2 = new AccountGroup(
          {
              index: 2,
              userId: ObjectId("5b0444b900f87f1348b55fed")
              image: "https://www.jqueryscript.net/images/Simplest-Responsive-jQuery-Image-Lightbox-Plugin-simple-lightbox.jpg",
              name: "accountGroupTest",
          }
      );
      accountGroup2.save(function (err, accountGroup2) {
          if (err) return console.error(err);
            console.log("guardat group2");
      });
      var account3 = new Account(
          {
              groupId: 2,
              userId: ObjectId("5b0444b900f87f1348b55fed"),
              name: "Facebook",
              image: "https://www.codeproject.com/KB/GDI-plus/ImageProcessing2/img.jpg",
              description: "descriptiontest",
              user: "facebookUser",
              password: "ThisIsMyPassword",
              index: 1
          }
      );
      account3.save(function (err, account3) {
          if (err) return console.error(err);
            console.log("guardat account3");
      });
      // var session = new Session({
      //     userId: user2._id,
      //     ip: "192.168.1.1",
      //     location: "Somewhere",
      //     browser: "shitfox",
      //     os: "win",
      // });
      // session.save(function (err, session) {
      //     if (err) return console.error(err);
      //       console.log("guardat session");
      // });
      // var cryptoUser = new CryptoUser({
      //     userid: user2._id,
      //     privatekey: "thisisnotprivatekey"
      // });
      // cryptoUser.save(function (err, cryptoUser) {
      //     if (err) return console.error(err);
      //       console.log("guardat crypto");
      // });
    });
//}, millisecondsToWait);
