var urlRoot 				= "/api/v1";
var _						= require('underscore');
var anonymousAllowedRoutes 	= ['login', 'register'];
var User 					= require("../controllers/UserController");

module.exports.replaceUrl = function(req, res, next){
	req.url = req.url.replace(urlRoot, "");
    next();
}

module.exports.hasAccess = function(req, res, next){
	if(_.include(anonymousAllowedRoutes, req.url.substring(1))){
        next();
    } else {
		User.isLogged(req.get('Authentication'), function(err, user){
			if(err){
				var errorStatus = {
					errorCode: err.errorCode,
					errorKey: err.errorKey
				}
				return res.status(err.status).send(errorStatus);
			}
			next();
		});
    }
}
