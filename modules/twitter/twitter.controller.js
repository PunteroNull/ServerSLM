const Twitter = require('twitter');

//Trae los Tweets de un usuario y los procesa
exports.getTweets = function(username, cb) {
    let client = new Twitter(ConfigServer.twitterApi);

    client.get('statuses/user_timeline', {
        screen_name: username,
        count: 200,
        exclude_replies: false,
        include_rts: true
    }, function(error, tweets) {
        if (error) {
            console.log("[ERROR] No se pudieron obtener los tweets del usuario");
            return cb(error, null);
        }

        if (!tweets || !tweets.length) {
            console.log("[ERROR] No se encontro ningun tweet");
            return cb("ERROR");
        }

        var auxString = "";

        _.each(tweets, function(tweet) {
            auxString = auxString + tweet.text + " . ";
        });

        auxString = auxString.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
        auxString = auxString.replace(/(\r\n|\n|\r|"|\\)/gm, "");
        auxString = auxString.replace(/(RT|via)((?:\b\W*@\w+)+)/g, '');
        auxString = auxString.replace(/RT/g, '');
        auxString = auxString.replace(/#/g, '');
        auxString = auxString.replace(/@/g, '');
        auxString = auxString.replace(/YouTube video/g, '');
        // auxString = auxString.replace(/(?:@)[\n\S]+/g, '');

        return cb(null, auxString);
    });
}

//Trae los tweets de los usuario que sigue el usuario
exports.getFollowersTweets = function(username, cb) {
    let client = new Twitter(ConfigServer.twitterApi);
    let that = this;

    client.get('friends/list', {
        screen_name: username,
        count: 200
    }, function(error, friends) {
        if (error || !friends ||!friends.users) {
            console.log("[ERROR] No se pudieron obtener los amigos del usuario");
            return cb(error || "ERROR");
        }

        friends.users.sort(sortFriends);
        friends.users.reverse();

        let arrayFriends = _.pluck(friends.users.slice(0, 14), 'screen_name'); //Ponerlo en un config para poder variar la cantidad
        
        async.map(arrayFriends, that.getTweets, function(err, results) {
            if (err) {
                console.log("[ERROR] No se pudieron obtener los tweets de los amigos del usuario");
                return cb(err);
            } else {
                return cb(null, results);
            }
        });
    });
}

exports.buscarTweets = function(words, cb) {
    let client = new Twitter(ConfigServer.twitterApi);

    client.get('search/tweets', {
        q: words,
        count: 200
    }, function(error, tweets, response) {
        if (error || !tweets || !tweets.statuses) {
            console.log("[ERROR] No se pudo buscar tweets");
            return cb(true, null);
        }

        let slicedTweets = tweets.statuses.slice(0, 3);
        let prepareExecution = function(tweet, cb){
            getEmbedData(client, tweet, cb);
        };

        async.mapLimit(slicedTweets, 10, prepareExecution, function(err, resp){
            if(err) {
                console.log("[ERROR] No se pudo obtener la informacion embebida de los tweets");
                return cb(err);
            }

            return cb(null, resp);
        })
    });
};

exports.buscarTwitterUsers = function(word, cb) {
    let client = new Twitter(ConfigServer.twitterApi);

    client.get('users/search', { "q":word, "count":4 }, function(error, users){
        if (error || !users) {
            console.log("[ERROR] No se pudo buscar los amigos del usuario");
            return cb(error,null);
        }

        let resultado = [];

        if (!users.length) {
            return cb(null, resultado);
        } 

        _.each(users, function(tweet){
            let aux = {};
            aux.id_str = tweet.id_str;
            aux.profile_image_url = tweet.profile_image_url;
            aux.profile_link_color = tweet.profile_link_color;
            aux.name = tweet.name;
            aux.screen_name = tweet.screen_name;
            aux.description = tweet.description;
            aux.followers_count = tweet.followers_count;
            resultado.push(aux);
        });

        return cb(null,resultado);
    });
};

function sortFriends(a, b) {
    var verifiedA = 0;
    var verifiedB = 0;

    if (a.verified) {
        verifiedA = 1;
    }

    if (b.verified) {
        verifiedB = 1;
    }

    return ((verifiedA * 0.2 * a.followers_count) + a.followers_count) - ((verifiedB * 0.2 * b.followers_count) + b.followers_count)
}

function getEmbedData(client, tweet, cb){
    client.get('statuses/oembed', {
        id: tweet.id_str
    }, function(error, tweetData) {
        if (error) {
            console.log("[ERROR] No se pudo obtener informacion embebida del tweet");
            return cb(error);
        }

        return cb(null, tweetData);
    });
}
