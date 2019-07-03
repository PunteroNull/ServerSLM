const twitterController = require('./twitter.controller');
const result = require('../result/result.controller')
const message = require('../../common/messages.json');
const watsonController = require('../watson/watson.controller');

exports.analyzeFollowingCachedROS = function(req, res, next) {
    let username = req.query.name;
    let that = this;

    result.getResultByUser(username, function(err, resp){
        if (!err && resp && !_.isEmpty(resp)) {
            res.sender(resp);
            return next();
        } else {
            that.analyzeFollowingROS(req, res, next)
        }
    })
};

exports.analyzeFollowingROS = function(req, res, next) {
    let username = req.query.name;
    let email = req.query.email;

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

            watsonController.analyzeMultipleTextAlt(username, textUser, textsFriends, email, function() {});

            res.sender(message.emailSended);
            return next();
        });
    });
};

exports.buscarTweets = function(req, res, next) {
    let words = req.query.words;
    
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
    let words = req.query.words;
    
    twitterController.buscarTwitterUsers(words, function(err, resp){
        if (err) {
            res.sender(message.cantGetTweets);
            return next();
        }

        res.sender(resp);
        return next();
    })
};
