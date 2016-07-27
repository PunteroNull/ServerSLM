var twitterController = require('../controllers/twitter');
var ibmController = require('../controllers/ibm');
var cacheController = require('../controllers/cache');
var Twitter = require('twitter');

exports.buscarTwitterUsers = function(req, res, next) {
    if(req.query.words){
        var q = req.query.words;
        twitterController.getTUsers(q,function(err,data){
            if(err){
                res.status(500);
                res.send(err);
                next();
            }
            res.send(data);
            next();
        })
    } else {
        res.status(500);
        res.send("Falta la palabra a buscar");
        next();
    }
};

exports.buscarTweets = function(req, res, next) {
    if(req.query.words){
        var q = req.query.words;
        twitterController.getSearch(q,function(err,data){
            if(err){
                res.status(500);
                res.send(err);
                next();
            }
            res.send(data);
            next();
        })
    } else {
        res.status(500);
        res.send("Falta la palabra a buscar");
        next();
    }
};

exports.analyze = function(req, res, next) {
    if(req.query.name){
        var username = req.query.name;
        twitterController.getTweets(username,function(err,data){
            if(err || !data){
                res.status(500);
                res.send(err);
                return next();
            }
            ibmController.analyzeText(data,function(response){})
            res.send({"Status":"Te vamos a mandar un mail con el codigo"});
            next();
        })
    } else {
        res.status(500);
        res.send("Falta el username");
        next();
    }
};

exports.analyzeFollowing = function(req, res, next) {
    if(req.query.name){
        var username = req.query.name;
        twitterController.getTweets(username,function(err,textUser){
            if(err){
                res.status(500);
                res.send(err);
                return next();
            }
            twitterController.getFollowersTweets(username,function(err,textsFriends){
                if(err){
                    res.status(500);
                    res.send(err);
                    next();
                }
                ibmController.analyzeMultipleText(textUser,textsFriends,function(response){})
                res.send({"Status":"Te vamos a mandar un mail con el codigo"});
                next();
            })
        })
    } else {
        res.status(500);
        res.send("Falta el username");
        next();
    }
};

exports.analyzeFollowingCached = function(req, res, next) {
    if(req.query.name){
        var username = req.query.name;
        cacheController.analizeUser(username, function(response){})
    } else {
        res.status(500);
        res.send("Falta el username");
        next();
    }
};
