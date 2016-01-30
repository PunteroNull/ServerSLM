// var twitterController = require('../controllers/twitter');
var Twitter = require('twitter');
var config = {
    "consumer_key": 'dD06rkZDLMF1YpFn0irBMWYG4',
    "consumer_secret": 'gzZxGkEgRwxU5GnMu3jIRy2AbAZQ8yFdIdxtdFgNm5w75Llxys',
    "access_token_key": '3499369996-ZJsppu2i2NkWeyJZiYpIIB1D3NX34cyweAh75L9',
    "access_token_secret": 'i8moPiByClSzqIr4aNC5A9TKcSGbVH3OMoVqZn9f28Sd3'
}

exports.trendCloset = function(req, res, next) {
    var client = new Twitter(config);
    client.get('trends/closest', {"lat":37.781157,"long":-122.400612831116}, function(error, tweets, response){
        if(error)
            return res.send("FALLO API")
        res.send(response.body)
        next();
    });
};

exports.trendWorld = function(req, res, next) {
    var client = new Twitter(config);
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
    var client = new Twitter(config);
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
