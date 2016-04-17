var express = require('express');
var router = express.Router();
var twitterRoute = require('./twitter');
var ibmRoute = require('./ibm');

router.get('/twitter',twitterRoute.analyze);

router.get('/testProccess', ibmRoute.test);

router.post('/feedback', ibmRoute.feedback);

module.exports = router;
