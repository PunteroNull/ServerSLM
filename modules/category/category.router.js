const resultController = require('./category.controller');

exports.similarCategories = function(req, res, next) {
    resultController.similarCategories(req.query.category, req.body.categoriesFromResult, function(err, resp) {
        if (err) {
            return res.status(500).send("ERROR DEL SERVIDOR");
        }

        res.sender(resp);
        next();
    });
};
