var twitterController = require('../controllers/twitter');
var ibmController = require('../controllers/ibm');
var cacheController = require('../controllers/cache');

exports.analyze = function(req, res, next) {
    if (req.query.name) {
        var username = req.query.name;
        twitterController.getTweets(username, function(err, data) {
            if (err || !data) {
                res.status(500);
                res.send(err);
                return next();
            }
            ibmController.analyzeText(data, function(response) {})
            res.send({
                "Status": "Te vamos a mandar un mail con el codigo"
            });
            next();
        })
    } else {
        res.status(500);
        res.send("Falta el username");
        next();
    }
};

exports.analyzeFollowing = function(req, res, next) {
    if (req.query.name) {
        var username = req.query.name;
        twitterController.getTweets(username, function(err, textUser) {
            if (err) {
                res.status(500);
                res.send(err);
                return next();
            }
            twitterController.getFollowersTweets(username, function(err, textsFriends) {
                if (err) {
                    res.status(500);
                    res.send(err);
                    next();
                }
                ibmController.analyzeMultipleText(textUser, textsFriends, function(response) {})
                res.send({
                    "Status": "Te vamos a mandar un mail con el codigo"
                });
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
    if (req.query.name) {
        var username = req.query.name;
        async.waterfall([
            function(cb){
                cacheController.analizeUser(username, function(response) {
                    
                })
            }
        ], function(err,result){

        })
    } else {
        res.status(500);
        res.send("Falta el username");
        next();
    }
};
