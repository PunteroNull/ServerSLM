var youtubeController = require('./youtube.controller');
var message = require('../../common/messages.json');

exports.getVideos = function(req, res, next) {
    var keyword = req.query.keyword;
    youtubeController.getVideosURL(keyword, function(err, resp) {
        if (err || !resp) {
            res.sender(message.cantGetVideos);
            return next();
        } else {
            res.sender(resp);
            return next();
        }
    })
};
