const config = require('../config/config.json');
let init;
const http = require('http');
const app = require('../app');

try {
    init = require('../config/init.json');
} catch(err) {
    init = {};
}

global._ = require('underscore');
global.async = require('async');
global.moment = require('moment');
global.ConfigServer = setInitConfig();

let server = http.createServer(app).listen(ConfigServer.port);

function setInitConfig() {
   return _.extend(config, init);
}
