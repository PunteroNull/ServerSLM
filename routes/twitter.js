var twitterController = require('../controllers/twitter');
var ibmController = require('../controllers/ibm');
var Twitter = require('twitter');

exports.trendCloset = function(req, res, next) {
    var client = new Twitter(GlobalConfig.twitterApi);
    client.get('trends/closest', {"lat":37.781157,"long":-122.400612831116}, function(error, tweets, response){
        if(error)
            return res.send("FALLO API")
        res.send(response.body)
        next();
    });
};

exports.trendWorld = function(req, res, next) {
    var client = new Twitter(GlobalConfig.twitterApi);
    client.get('trends/place', {"id":1}, function(error, tweets, response){
        if(error)
            return res.send("FALLO API")
        res.send(response.body)
        next();
    });
};

exports.requestToken = function(req, res, next) {
    var client = new Twitter({
        consumer_key: 'dD06rkZDLMF1YpFn0irBMWYG4',
        consumer_secret: 'gzZxGkEgRwxU5GnMu3jIRy2AbAZQ8yFdIdxtdFgNm5w75Llxys'
    });
    client.get('oauth/request_token', {"callback":"localhost:3000/loading.html"}, function(error, tweets, response){
        if(error)
            return res.send(error)
        console.log(tweets)
        console.log(response)
        // res.send("JOYA");
        next();
    });
};

exports.userTweets = function(req, res, next) {
    var client = new Twitter(GlobalConfig.twitterApi);
    var name = req.query.name;
    if(!name)
        name = "TengenPixel";
    client.get('statuses/user_timeline', {"screen_name":name,"count":200,"exclude_replies":false,"include_rts":true}, function(error, tweets, response){
        if(error)
            return res.send(error)
        // console.log(tweets)
        var elString = "";
        _.each(tweets, function(tweet){
            elString = elString + tweet.text + " . ";
        });

        elString = elString.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
        elString = elString.replace(/(\r\n|\n|\r|"|\\)/gm,"");
        elString = elString.replace(/(?:@)[\n\S]+/g, '');
        res.send(elString);
        next();
    });
};

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
