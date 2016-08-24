var twitterController = require('./twitter.controller');
var alchemyController = require('../alchemy/alchemy.controller');
var message = require('../../common/messages.json');

exports.analyze = function(req, res, next) {
    var username = req.query.name;
    twitterController.getTweets(username, function(err, data) {
        if (err || !data) {
            res.sender(message.cantGetTweets);
            return next();
        }
        alchemyController.analyzeText(username, data, function(response) {});
        res.sender(message.emailSended);
        next();
    })
};

exports.analyzeFollowing = function(req, res, next) {
    var username = req.query.name;
    twitterController.getTweets(username, function(err, textUser) {
        if (err) {
            res.sender(message.cantGetTweets);
            return next();
        }
        twitterController.getFollowersTweets(username, function(err, textsFriends) {
            if (err) {
                res.sender(message.cantGetTweets);
                return next();
            }
            alchemyController.analyzeMultipleText(username, textUser, textsFriends, function(response) {});
            res.sender(message.emailSended);
            next();
        })
    })
};

exports.analyzeFollowingCached = function(req, res, next) {
    var username = req.query.name;
    res.sender({"status":200, "message":"test"});
    next();
    // async.waterfall([
    //     function(cb){
    //         cacheController.analizeUser(username, function(response) {
    //
    //         })
    //     }
    // ], function(err,result){
    //
    // })
};
