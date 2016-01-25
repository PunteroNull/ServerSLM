var express = require('express');
var router = express.Router();
var twitterRoute = require('./twitter');

router.get('/hello', function (req, res) {
  res.send('Hello World!');
});

router.get('/trendCloset', twitterRoute.trendCloset);

router.get('/trendWorld', twitterRoute.trendWorld);

router.get('/requestToken', twitterRoute.requestToken);

module.exports = router;