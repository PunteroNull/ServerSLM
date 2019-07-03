const resultController = require('./result.controller');

exports.getResult = function(req, res, next) {
    resultController.getResult(req.query.code, function(err, resp) {
        if (err) {
            return res.status(500).send("ERROR DEL SERVIDOR");
        } 

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
