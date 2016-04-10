var twitterController = require('../controllers/twitter');
var ibmController = require('../controllers/ibm');
var Twitter = require('twitter');

exports.analyze = function(req, res, next) {
    if(req.query.name){
        var username = req.query.name;
        twitterController.getTweets(username,function(err,data){
            if(err){
                res.status(500);
                res.send(err);
                next();
            }
            ibmController.analyzeText(data,function(response){
                res.send(response);
                next();
            })
        })
    } else {
        res.status(500);
        res.send("Falta el username");
        next();
    }
};
