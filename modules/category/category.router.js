var resultController = require('./category.controller');

exports.similarCategories = function(req, res, next) {
    resultController.similarCategories(req.query.category, req.body.categoriesFromResult, function(resp) {
        res.sender(resp);
        next();
    });
};
