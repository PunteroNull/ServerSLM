var AlchemyAPI = require('../alchemyapi.js');
var alchemyapi = new AlchemyAPI();
var ibmController = require('../controllers/ibm');

exports.test = function(req, res, next) {
    ibmController.test(function(resp){
        res.send(resp);
        next();
    });
};

exports.feedback = function(req, res, next) {
    ibmController.feedback(function(resp){
        res.send(resp);
        next();
    });
};
