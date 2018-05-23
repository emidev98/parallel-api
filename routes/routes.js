module.exports = function(app){

    /******************
    * CONTROLLERS *****
    ******************/

    var successCodes = require('../responses/successCodes');
    var User         = require('../controllers/UserController');
    var AccountGroup = require('../controllers/GroupsController');
    var Account      = require('../controllers/AccountController');
    var helloWorld   = require('../controllers/HelloWorldController');

    /******************
    * HELLOWORLD ROUTE*
    ******************/

    app.get('/helloworld', function(req, res){
        helloWorld.getHelloWorld(function(err, helloWorld){
            if(err) return res.status(500).send("There was a problem finding the users.");
            res.status(200).send(helloWorld[0]);
        });
    });

    /******************
    * USERS ROUTES ****
    ******************/

    app.put('/google-sign-in', function(req, res) {
        User.googleSignIn(req.body, function(err, user){
            if(err){
                console.log("1");
                var errorStatus = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(errorStatus);
            }
            var tokenmail = user.token+"|"+user.email;
            var authorization = Buffer.from(tokenmail).toString('base64');
            var responseObject = {
                data: {
                    id : user._id,
                    token : authorization,
                }
            }
            res.status(200).send(responseObject);
        })
    })

    app.put('/register', function(req, res){
        User.register(req.body, function(err, user){
            if(err){
                console.log("2");
                var errorStatus = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(errorStatus);
            }
            var tokenmail = user.token+"|"+user.email;
            var authorization = Buffer.from(tokenmail).toString('base64');
            var responseObject = {
                data: {
                    id : user._id,
                    token : authorization,
                }
            }

            res.status(200).send(responseObject);
        });
    });


    app.post('/login', function(req, res){
        User.login(req.body, function(err, userDB){
            if (err) {
                console.log("3");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var tokenmail = userDB.token+"|"+userDB.email;
            var authorization = Buffer.from(tokenmail).toString('base64');
            var returnUser = {
                data: {
                    id : userDB._id,
                    token: authorization,
                }
            }
            res.status(200).send(returnUser);
        });
    });

    app.get('/user/:id', function(req, res){
        User.getUser(req.params.id, function(err, user){
            if (err) {
                console.log("4");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnUser = {
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    age: user.age,
                    email: user.email,
                    password: user.password,
                    language: user.language,
                    styles: {
                        backgroundImage: user.styles.backgroundImage,
                        isGridView: user.styles.isGridView,
                        image: user.styles.image
                    }
                }
            }
            res.status(200).send(returnUser);
        })
    });

    app.post('/user/:id', function(req, res){
        User.modifyUser(req.params.id, req.body, function(err, user){
            if (err) {
                console.log("5");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnUser = {
                success:{
                    successCode: successCodes.USER_SUCCESSFULLY_MODIFIED,
                    successKey: "SUCCESS.USER_SUCCESSFULLY_MODIFIED"
                },
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    age: user.age,
                    email: user.email,
                    password: user.password,
                    language: user.language,
                    styles: {
                        backgroundImage: user.styles.backgroundImage,
                        isGridView: user.styles.isGridView,
                        image: user.styles.image
                    }
                }
            }
            res.status(200).send(returnUser);
        })
    })

    app.delete('/user/:id', function(req, res){
        User.deleteUser(req.params.id, function(err, user){
            if (err) {
                console.log("6");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnUser = {
                success:{
                    successCode: successCodes.USER_SUCCESSFULLY_DELETED,
                    successKey: "SUCCESS.USER_SUCCESSFULLY_DELETED"
                },
                data: {
                    id: user._id
                }
            }
            res.status(200).send(returnUser);
        })
    })

    app.post('/user/change-password/:id', function(req, res){
        console.log("In routes");
        User.changePassword(req.body, req.params.id, function(err, user){
            if (err) {
                console.log("7");
                console.log(err)
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            console.log(user)
            var returnUser = {
                success:{
                    successCode: successCodes.PASSWORD_SUCCESSFULLY_CHANGED,
                    successKey: "SUCCESS.PASSWORD_SUCCESSFULLY_CHANGED"
                },
                data: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    age: user.age,
                    email : user.email,
                    password : user.password,
                    language : user.language,
                    styles: user.styles
                }
            }
            res.status(200).send(returnUser);
        })
    })

    /*********************
    * ACCOUNTS ROUTES ****
    **********************/

    app.get('/accounts', function(req, res){
        var userEmail = req.get('email');
        console.log(userEmail);
        Account.getAllAccounts(userEmail, function(err, accounts){
            if (err) {
                console.log("8");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnAccounts = [];
            for (var i = 0; i < accounts.length; i++){
                returnAccounts[i] = {
                    id: accounts[i]._id,
                    groupId: accounts[i].groupId,
                    name: accounts[i].name,
                    image: accounts[i].image,
                    description: accounts[i].description,
                    user: accounts[i].user,
                    password: accounts[i].password,
                    index: accounts[i].index
                }
            }
            var responseReturn = {
                data : returnAccounts
            }
            res.status(200).send(responseReturn);
        });
    });

    app.get('/accounts/:id', function(req, res){
        var userEmail = req.get('email');
        var accountId = req.params.id;
        Account.getAccountInfo(userEmail, accountId, function(err, account){
            if (err) {
                console.log("9");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var responseReturn = {
                data : {
                    id: account.id,
                    groupId: account.groupId,
                    title: account.title,
                    image: account.image,
                    description: account.description,
                    user: account.user,
                    password: account.password
                }
            }
            res.status(200).send(responseReturn);
        })
    })

    app.put('/accounts', function(req, res){
        var userEmail = req.get('email');
        Account.createAccount(userEmail, req.body, function(err, account){
            if (err) {
                console.log("10");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnAccount = {
                success: {
                    successCode: successCodes.ACCOUNT_SUCCESSFULLY_CREATED,
                    successKey: "SUCCESS.ACCOUNT_SUCCESSFULLY_CREATED"
                },
                data: {
                    id: account._id,
                    groupId: account.groupId,
                    name : account.name,
                    image : account.image,
                    description : account.description,
                    user : account.user,
                    password : account.password,
                    index: account.index
                }
            }
            res.status(200).send(returnAccount);
        });
    });

    app.delete('/accounts/:id', function(req, res){
        Account.deleteAccount(req.params.id, function(err, account){
            if (err) {
                console.log("11");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnAccount = {
                success: {
                    successCode: successCodes.ACCOUNT_SUCCESSFULLY_DELETED,
                    successKey: "SUCCESS.ACCOUNT_SUCCESSFULLY_DELETED"
                },
                data: {
                    id: account._id,
                    groupId: account.groupId,
                    name : account.name,
                    image : account.image,
                    description : account.description,
                    user : account.user,
                    password : account.password,
                    index : account.index
                }
            }
            res.status(200).send(returnAccount);
        });
    });

    app.post('/accounts/:id', function(req, res){
        var userEmail = req.get('email');
        Account.modifyAccount(userEmail, req.params.id, req.body, function(err, account){
            if (err) {
                console.log("12");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnAccount = {
                success: {
                    successCode: successCodes.ACCOUNT_SUCCESSFULLY_MODIFIED,
                    successKey: "SUCCESS.ACCOUNT_SUCCESSFULLY_MODIFIED"
                },
                data: {
                    groupId: account.groupId,
                    name : account.name,
                    image : account.image,
                    description : account.description,
                    user : account.user,
                    password : account.password,
                    index: account.index
                }
            }
            res.status(200).send(returnAccount);
        });
    });


    /*********************
    * GROUPS ROUTES ******
    *********************/

    app.put('/groups', function(req, res){
        var userEmail = req.get('email');
        AccountGroup.createGroup(userEmail, req.body, function(err, group){
            if (err) {
                console.log("13");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnGroup = {
                success: {
                    successCode: successCodes.GROUP_SUCCESSFULLY_CREATED,
                    successKey: "SUCCESS.GROUP_SUCCESSFULLY_CREATED"
                },
                data: {
                    id: group._id,
                    index: group.index,
                    name: group.name,
                    image: group.image
                }
            }
            res.status(200).send(returnGroup);
        });
    });

    app.post('/groups/:id', function(req, res){
        AccountGroup.modifyGroup(req.params.id, req.body, function(err, group){
            if (err) {
                console.log("14");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnGroup = {
                success: {
                    successCode: successCodes.GROUP_SUCCESSFULLY_MODIFIED,
                    successKey: "SUCCESS.GROUP_SUCCESSFULLY_MODIFIED"
                },
                data: {
                    name: group.name,
                    image: group.image,
                    index: group.index
                }
            }
            res.status(200).send(returnGroup);
        })
    });

    app.delete('/groups/:id', function(req, res){
        AccountGroup.deleteGroup(req.params.id, function(err,group){
            if (err) {
                console.log("15");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnGroup = {
                success: {
                    successCode: successCodes.GROUP_SUCCESSFULLY_DELETED,
                    successKey: "SUCCESS.GROUP_SUCCESSFULLY_DELETED"
                },
                data: {
                    id: group._id,
                    index: group.index,
                    name: group.name,
                    image: group.image
                }
            }
            res.status(200).send(returnGroup);
        })
    });

    app.get('/groups/:id', function(req, res){
        AccountGroup.findOneGroup(req.params.id, function(err, group){
            if (err) {
                console.log("16");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnGroup = {
                data: {
                    id: group._id,
                    index: group.index,
                    name: group.name,
                    image: group.image
                }
            }
            res.status(200).send(returnGroup);
        })
    })

    app.get('/groups', function(req, res){
        var userEmail = req.get('email');
        AccountGroup.findAll(userEmail, function(err, groups){
            if (err) {
                console.log("17");
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnGroups = [];
            for (var i = 0; i < groups.length; i++){
                returnGroups[i] = {
                    id: groups[i]._id,
                    index: groups[i].index,
                    name: groups[i].name,
                    image: groups[i].image
                }
            }
            var returnGroups = {
                data: returnGroups
            }
            res.status(200).send(returnGroups);
        })
    })
}
