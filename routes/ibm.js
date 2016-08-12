var AlchemyAPI = require('../alchemyapi.js');
var alchemyapi = new AlchemyAPI();
var ibmController = require('../controllers/ibm');

exports.test = function(req, res, next) {
    ibmController.test(function(resp) {
        res.send(resp);
        next();
    });
};

exports.feedback = function(req, res, next) {
    ibmController.feedback(req.body, function(resp) {
        res.send(resp);
        next();
    });
};

exports.getResult = function(req, res, next) {
    ibmController.getResult(req.query.code, function(resp) {
        res.send(resp);
        next();
    });
};
