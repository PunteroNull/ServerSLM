const YouTube = require('youtube-node');
const youTube = new YouTube();
youTube.setKey('AIzaSyBLcQ-4fL54I295Iol_dv4dq4JQSqvvooY'); //Config

exports.getVideosURL = function (keyword, cb) {
    youTube.search(keyword, 10, function (err, result) {
        if (err) {
            console.log("[ERROR] No se pudieron obtener los videos de YouTube");
            return cb(err);
        } else {
            return cb(null, JSON.stringify(result, null, 2));
        }
    });
}