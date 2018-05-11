module.exports = function(app){

    /******************
    * CONTROLLERS *****
    ******************/

    var helloWorld = require('../controllers/HelloWorldController');

    /******************
    * HELLOWORLD ROUTE*
    ******************/

    app.get('/helloworld', function(req, res){
        helloWorld.getHelloWorld(function(err, helloWorld){
            if(err) return res.status(500).send("There was a problem finding the users.");
            res.status(200).send(helloWorld[0]);
        });
    });
}
