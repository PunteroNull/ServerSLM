var express = require('express');
var path = require('path');
var compress = require('compression');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bodyParserJsonError = require('express-body-parser-json-error');

var validator = require('./middleware/validator');

var app = express();
var router = require('./routes');

// Sirve para atajar errores de mandar mas de una vez el res.send
app.use(function(req, res, next) {
    res.sender = function(ob) {
        if (!this.sendFlag) {
            this.sendFlag = 1;
            if (ob && ob.status)
                this.status(ob.status);
            this.send(ob);
        } else {
            console.log("Se envio dos veces");
            console.log(ob);
        }
    };
    next();
});

// Configuraciones de Headers y OPTIONS
app.use(function(req, res, next) {
    var oneof = false;
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Authorization, networkId, Content-Type, Accept, Origin");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    if (req.method == 'OPTIONS')
        res.status(200).send();
    else
        next();
});

//Set bodyParser middleware
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
app.use(bodyParserJsonError());
//Set compress middleware
app.use(compress());

//Set cookieParser middleware
app.use(cookieParser());

// Middleware de validacion del input
app.use(function(req, res, next) {
    validator.valid(req, res, next);
});


//Set routers
app.use('/', router);

module.exports = app;
