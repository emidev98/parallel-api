module.exports = function(app){

    /******************
    * CONTROLLERS *****
    ******************/

    var helloWorld = require('../controllers/HelloWorldController');
    var User = require('../controllers/UserController');

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

    app.post('/register', function(req, res){
        User.register(req.body, function(err, user){
            if(err) return res.status(err.status).send(err.message);
            var responseObject = {
                token : user._id,
                language : user.language,
                email : user.email,
                age : user.age,
                firstname : user.firstname,
                lastname : user.lastname,
            }
            res.status(200).send(responseObject);
        });
    });
}
