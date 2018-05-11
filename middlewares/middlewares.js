var urlRoot = "/api/v1";

module.exports.replaceUrl = function(req, res, next){
	req.url = req.url.replace(urlRoot, "");
    next();
}
