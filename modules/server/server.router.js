exports.checkStatus = function(req, res, next) {
	res.sender({ status: 200, message: 'server_up' });
	next();
};
