const nodemailer = require('nodemailer');

exports.emailSend = function(content, cb) {
    let transporter = nodemailer.createTransport('smtps://malcolmtec%40gmail.com:rhderboerawmmnwa@smtp.gmail.com');

    transporter.sendMail(content, function(error, info) {
        if (error) {
            console.log("[ERROR] Hubo un problema al enviar el email");
            return cb(error);
        }

        return cb(null, info)
    });
};
