var nodemailer = require('nodemailer');

exports.emailSend = function(content, cb) {
    var transporter = nodemailer.createTransport('smtps://malcolmtec%40gmail.com:rhderboerawmmnwa@smtp.gmail.com'); //Cambiarlo mas adelante
    transporter.sendMail(content, function(error, info) {
        if (error)
            return cb(error);
        cb(null, info)
    });
};
