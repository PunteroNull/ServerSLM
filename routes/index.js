var express = require('express');
var router = express.Router();
var twitterRoute = require('./twitter');
var ibmRoute = require('./ibm');

// router.get('/hello', function (req, res) {
//   res.send('Hello World!');
// });
//
// router.get('/trendCloset', twitterRoute.trendCloset);
//
// router.get('/trendWorld', twitterRoute.trendWorld);
//
// router.get('/requestToken', twitterRoute.requestToken);
//
// router.get('/userTweets', twitterRoute.userTweets);

router.get('/twitter',twitterRoute.analyze);

router.get('/testProccess', ibmRoute.test);

module.exports = router;
