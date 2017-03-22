var twitterController = require('./twitter.controller');
var alchemyController = require('../alchemy/alchemy.controller');
var result = require('../result/result.controller')
var message = require('../../common/messages.json');
var rosetteController = require('../rosette/rosette.controller')

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
    var email = req.query.email;
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
            alchemyController.analyzeMultipleText(username, textUser, textsFriends, email, function(response) {});
            res.sender(message.emailSended);
            next();
        })
    })
};

exports.analyzeFollowingCached = function(req, res, next) {
    var username = req.query.name;
    var that = this;
    result.getResultByUser(username, function(err, resp){
        if(!err && resp && !_.isEmpty(resp)){
            res.sender(resp);
            return next();
        } else {
            that.analyzeFollowing(req, res, next)
        }
    })
};

exports.analyzeFollowingCachedROS = function(req, res, next) {
    var username = req.query.name;
    var that = this;
    result.getResultByUser(username, function(err, resp){
        if(!err && resp && !_.isEmpty(resp)){
            res.sender(resp);
            return next();
        } else {
            that.analyzeFollowingROS(req, res, next)
        }
    })
};

exports.analyzeFollowingROS = function(req, res, next) {
    var username = req.query.name;
    var email = req.query.email;
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
            alchemyController.analyzeMultipleTextAlt(username, textUser, textsFriends, email, function(response) {});
            res.sender(message.emailSended);
            next();
        })
    })
    // rosetteController.test2(function(resp){
    //     res.sender(resp);
    //     next();
    // });
};

exports.buscarTweets = function(req, res, next) {
    var words = req.query.words;
    var that = this;
    twitterController.buscarTweets(words, function(err, resp){
        if (err) {
            res.sender(message.cantGetTweets);
            return next();
        }

        res.sender(resp);
        return next();
    })
};

exports.buscarTwitterUsers = function(req, res, next) {
    var words = req.query.words;
    var that = this;
    twitterController.buscarTwitterUsers(words, function(err, resp){
        if (err) {
            res.sender(message.cantGetTweets);
            return next();
        }

        res.sender(resp);
        return next();
    })
};
