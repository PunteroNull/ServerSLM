var youtubeController = require('../controllers/youtube');
var YouTube = require('youtube-node');

var youTube = new YouTube();

youTube.setKey('AIzaSyCKPodmpYK9qpneSTvjwVdrAH8EUUb4D_E');

exports.getVideos = function(words,cb){
   youTube.search(words, 5, function(error, result) {
    var videos = [];
    for (var i=0; i < result.items.length; i++){
            videos[i] = result.items[i].id.videoId;
        }
    cb(null,videos);
    });
}
