var express = require('express');
var router = express.Router();
var message = require('../common/messages.json');

var routeModule = require('./config.js').routeModule;
var configRoute = require('./routes.json');

//Middleware para procesar los filtros de las rutas
router.use(function(req, res, next) {
    var url = req.originalUrl;
    url = url.split('?')[0];
    if(!configRoute || !configRoute[url] || !configRoute[url][req.method])
        return res.sender(message.badRequest);

    var specificRoute = configRoute[url][req.method];

    var urlRoute = routeModule[specificRoute.urlRoute];
    var executeFunction = specificRoute.executeFunction;

    urlRoute[executeFunction](req, res, function() {});
});

module.exports = router;
