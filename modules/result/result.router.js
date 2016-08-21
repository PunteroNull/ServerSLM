var resultController = require('./result.controller');

exports.getResult = function(req, res, next) {
    resultController.getResult(req.query.code, function(resp) {
        res.sender(resp);
        next();
    });
};

exports.feedback = function(req, res, next) {
    resultController.feedback(req.body, function(resp) {
        res.send(resp);
        next();
    });
};
