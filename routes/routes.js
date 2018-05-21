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

    app.put('/register', function(req, res){
        User.register(req.body, function(err, user){
            if(err){
                var errorStatus = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(errorStatus);
            }
            var tokenmail = user.token+"|"+user.email;
            var authorization = Buffer.from(tokenmail).toString('base64');
            var responseObject = {
                id : user._id,
                token : authorization,
            }
            res.status(200).send(responseObject);
        });
    });


    app.post('/login', function(req, res){
        User.login(req.body, function(err, userDB){
            if (err) {
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var tokenmail = userDB.token+"|"+userDB.email;
            var authorization = Buffer.from(tokenmail).toString('base64');
            var returnUser = {
                id : userDB._id,
                token: authorization,
            }
            res.status(200).send(returnUser);
        });
    });

    app.get('/user/:id', function(req, res){
        User.getUser(req.params.id, function(err, user){
            if (err) {
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnUser = {
                firstName: user.firstName,
                lastName: user.lastName,
                age: user.age,
                email: user.email,
                password: user.password,
                language: user.language,
                style: {
                    backgroundImage: user.style.backgroundImage,
                    isGridView: user.style.isGridView,
                    image: user.style.image
                }
            }
            res.status(200).send(returnUser);
        })
    });

    app.post('/user/:id', function(req, res){
        User.modifyUser(req.params.id, req.body, function(err, user){
            if (err) {
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
                    style: {
                        backgroundImage: user.style.backgroundImage,
                        isGridView: user.style.isGridView,
                        image: user.style.image
                    }
                }
            }
            res.status(200).send(returnUser);
        })
    })

    app.delete('/user/:id', function(req, res){
        User.deleteUser(req.params.id, function(err, user){
            if (err) {
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

    /*********************
    * ACCOUNTS ROUTES ****
    **********************/

    app.get('/accounts', function(req, res){
        var userEmail = req.get('email');
        console.log(userEmail);
        Account.getAllAccounts(userEmail, function(err, accounts){
            if (err) {
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
                    title: accounts[i].title,
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
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var responseReturn = {
                data : account
            }
            res.status(200).send(responseReturn);
        })
    })

    app.put('/accounts', function(req, res){
        var userEmail = req.get('email');
        Account.createAccount(userEmail, req.body, function(err, account){
            if (err) {
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
                    title : account.title,
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
                    title : account.title,
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
                    title : account.title,
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
                var error = {
                    errorCode: err.errorCode,
                    errorKey: err.errorKey
                }
                return res.status(err.status).send(error);
            }
            var returnGroups = {
                data: groups
            }
            res.status(200).send(returnGroups);
        })
    })
}
