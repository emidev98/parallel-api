module.exports = function(app){

    /******************
    * CONTROLLERS *****
    ******************/

    var helloWorld   = require('../controllers/HelloWorldController');
    var User         = require('../controllers/UserController');
    var Account      = require('../controllers/AccountController');
    var successCodes = require('../responses/successCodes');

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
            var responseObject = {
                id : user._id,
                token : user.token,
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
            var returnUser = {
                id : userDB._id,
                token: userDB.token,
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
                image: user.image,
                firstName: user.firstName,
                lastName: user.lastName,
                age: user.age,
                email: user.email,
                password: user.password,
                language: user.language
            }
            res.status(200).send(returnUser);
        })
    });

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
            var responseReturn = {
                data : accounts
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
                    userGroupId: account.userGroupId,
                    title : account.title,
                    image : account.image,
                    description : account.description,
                    user : account.user,
                    password : account.password
                }
            }
            res.status(200).send(returnAccount);
        });
    });

    app.delete('/accounts/:id', function(req, res){
        Account.deleteAccount(req.params.id, function(err, account){
            var returnAccount = {
                success: {
                    successCode: successCodes.ACCOUNT_SUCCESSFULLY_DELETED,
                    successKey: "SUCCESS.ACCOUNT_SUCCESSFULLY_DELETED"
                },
                data: {
                    id: account._id,
                    userGroupId: account.userGroupId,
                    title : account.title,
                    image : account.image,
                    description : account.description,
                    user : account.user,
                    password : account.password
                }
            }
            res.status(200).send(returnAccount);
        })
    })

    app.post('/accounts/:id', function(req, res){
        var userEmail = req.get('email');
        Account.modifyAccount(userEmail, req.params.id, req.body, function(err, account){
            var returnAccount = {
                success: {
                    successCode: successCodes.ACCOUNT_SUCCESSFULLY_MODIFIED,
                    successKey: "SUCCESS.ACCOUNT_SUCCESSFULLY_MODIFIED"
                },
                data: {
                    userGroupId: account.userGroupId,
                    title : account.title,
                    image : account.image,
                    description : account.description,
                    user : account.user,
                    password : account.password
                }
            }
            res.status(200).send(returnAccount);
        })
    })
}
