var twitterController = require('../controllers/twitter');
var Twitter = require('twitter');
var async = require('async');

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

exports.getFollowersTweets = function(username,cb){ //Trae los tweets de los usuario que sigue el usuario
    var client = new Twitter(GlobalConfigConnections.twitterApi);
    var that = this;
    client.get('friends/list', {"screen_name":username,"count":200}, function(error, friends, response){
        if(error || !friends.users)
            return cb(error,null);
        friends.users.sort(sortFriends);
        friends.users.reverse();
        var arrayFriends = _.pluck(friends.users.slice(0, 9), 'screen_name'); //Ponerlo en un config para poder variar la cantidad
        console.log(arrayFriends);
        async.map(arrayFriends, that.getTweets, function(err, results){
            if(err)
                return cb(err);
            else
                cb(null,results);
        });
    });
}

function sortFriends(a, b){
    var verifiedA = 0;
    var verifiedB = 0;
    if(a.verified)
        verifiedA = 1;
    if(b.verified)
        verifiedB = 1;
    return ((verifiedA*0.2*a.followers_count)+a.followers_count)-((verifiedB*0.2*b.followers_count)+b.followers_count)
}
