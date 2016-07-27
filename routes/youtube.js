var youtubeController = require('../controllers/youtube');
var youtube = require('youtube-node');

exports.busqueda = function(req, res, next) {
    if(req.query.words){
        var palabras = req.query.words;
        youtubeController.getVideos(palabras,function(err,data){
            if(err){
                res.status(500);
                res.send(err);
                next();
            }
            res.send(data);
            next();
            
        })
    } else {
        res.status(500);
        res.send("Falta la palabra a buscar");
        next();
    }
};
