var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var router = require('./routes');
global._ = require('underscore');
global.GlobalConfigConnections = require('./configs/connections.json');
global.GlobalConfig = require('./configs/values.json');

app.use(function(req, res, next) {
	var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Authorization, Content-Type, Accept, Origin");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    if (req.method == 'OPTIONS')
        res.status(200).send();
    else
        next();
});

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use('/', router);

app.listen(GlobalConfigConnections.port, function () {
  console.log('Puerto '+GlobalConfigConnections.port);
});
