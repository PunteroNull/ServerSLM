var twitterController = require('../controllers/twitter');
var Twitter = require('twitter');
var async = require('async');

exports.getTUsers = function(word,cb) {//Trae los usuarios de Twitter que comparten gustos
    var client = new Twitter(GlobalConfigConnections.twitterApi);
    client.get('users/search', {"q":word, "count":4}, function(error, users, response){
        if(error)
            return cb(error,null);
        var resultado = [];
        _.each(users, function(tweet){
            var aux = {};
            aux.id_str = tweet.id_str;
            aux.name = tweet.name;
            aux.screen_name = tweet.screen_name;
            aux.description = tweet.description;
            aux.followers_count = tweet.followers_count;
            resultado.push(aux);
        });
        cb(null,resultado);
    });
}

exports.getSearch = function(word,cb) {//Trae los Tweets relevantes relacionados a una query
    var client = new Twitter(GlobalConfigConnections.twitterApi);
    client.get('search/tweets', {"q":word, "count":5}, function(error, tweets, response){
        if(error)
            return cb(error,null);
        var resultado = [];
         _.each(tweets.statuses, function(tweet){
             resultado.push(tweet.id_str);
         });
        cb(null,resultado);
    });
}

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
        auxString = auxString.replace(/(RT|via)((?:\b\W*@\w+)+)/, '');
        auxString = auxString.replace(/RT/g, '');
        auxString = auxString.replace(/#/g, '');
        auxString = auxString.replace(/@/g, '');
        auxString = auxString.replace(/YouTube video/g, '');
        // auxString = auxString.replace(/(?:@)[\n\S]+/g, '');
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
        var arrayFriends = _.pluck(friends.users.slice(0, 14), 'screen_name'); //Ponerlo en un config para poder variar la cantidad
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
