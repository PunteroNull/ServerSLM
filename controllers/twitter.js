var twitterController = require('../controllers/twitter');
var Twitter = require('twitter');

exports.getTweets = function(username,cb){ //Trae los Tweets de un usuario y los procesa
    var client = new Twitter(GlobalConfigConnections.twitterApi);
    client.get('statuses/user_timeline', {"screen_name":username,"count":200,"exclude_replies":false,"include_rts":true}, function(error, tweets, response){
        if(error)
            return cb(error,null);
        var auxString = "";
        _.each(tweets, function(tweet){
            auxString = auxString + tweet.text + " . ";
        });
        auxString = auxString.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
        auxString = auxString.replace(/(\r\n|\n|\r|"|\\)/gm,"");
        auxString = auxString.replace(/(?:@)[\n\S]+/g, '');
        cb(null,auxString);
    });
}
