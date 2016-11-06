var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey('AIzaSyBLcQ-4fL54I295Iol_dv4dq4JQSqvvooY'); //Config

exports.getVideosURL = function(keyword, cb) {
    youTube.search(keyword, 10, function(err, result) {
      if(err){
          console.log(err);
        cb(err);
      } else {
        cb(null, JSON.stringify(result, null, 2));
      }
    });
}
