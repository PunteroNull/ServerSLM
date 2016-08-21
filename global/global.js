var cluster = require('cluster');
var config = require('../config/config.json');
var init;
var http = require('http');
var app = require('../app');

try {
    init = require('../config/init.json');
} catch(err) {
    init = {};
}

global._ = require('underscore');
global.async = require('async');
global.moment = require('moment');
global.ConfigServer = setInitConfig();

var server;

server = http.createServer(app).listen(ConfigServer.port);

function setInitConfig() {
   return _.extend(config, init);
}
