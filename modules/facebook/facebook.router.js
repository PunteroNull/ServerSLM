var facebookController = require('./facebook.controller');
var alchemyController = require('../alchemy/alchemy.controller');
var message = require('../../common/messages.json');

exports.analyze = function(req, res, next) {
    var username = req.query.name;
    facebookController.getHistory(username, function(err, data) {
        if (err || !data) {
            res.sender(message.cantGetHistory);
            return next();
        }
        alchemyController.analyzeText(data, function(response) {});
        res.sender(message.emailSended);
        next();
    })
};
