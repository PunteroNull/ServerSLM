const express = require('express');
const router = express.Router();
const message = require('../common/messages.json');

const routeModule = require('./config.js').routeModule;
const configRoute = require('./routes.json');

//Middleware para procesar los filtros de las rutas
router.use(function(req, res, next) {
    let url = req.originalUrl;
    url = url.split('?')[0];

    if(!configRoute || !configRoute[url] || !configRoute[url][req.method]){
        return res.sender(message.badRequest);
    }

    let specificRoute = configRoute[url][req.method];
    let urlRoute = routeModule[specificRoute.urlRoute];
    let executeFunction = specificRoute.executeFunction;

    urlRoute[executeFunction](req, res, function() {});
});

module.exports = router;
