var urlRoot 				= "/api/v1";
var _						= require('underscore');
var anonymousAllowedRoutes 	= ['auth'];
var replaceUrlText			= ['/auth', '/portal'];
var User 					= require("../controllers/UserController");

var AUTH = 0;
var PORTAL = 1;

module.exports.replaceUrl = function(req, res, next){
	req.url = req.url.replace(urlRoot, "");
    next();
}

module.exports.hasAccess = function(req, res, next){
	if(_.contains(anonymousAllowedRoutes, req.url.substring(1, 5))){
		req.url = req.url.replace(replaceUrlText[AUTH], "");
        next();
    }
	
	req.url = req.url.replace(replaceUrlText[PORTAL], "");
	var authentication = req.get('Authentication');
	var authenticationString = Buffer.from(authentication, 'base64').toString('utf8');
	var authenticationComponents = authenticationString.split("|");
    var tokenString = authenticationComponents[0];
    var emailString = authenticationComponents[1];
	User.isLogged(tokenString, emailString, function(err, user){
		if(err){
			var errorStatus = {
				errorCode: err.errorCode,
				errorKey: err.errorKey
			}
			return res.status(err.status).send(errorStatus);
		}
		req.headers.email = emailString;
		next();
	});
}
