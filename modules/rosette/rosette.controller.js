var RosetteApi = require('rosette-api');
var querystring = require('querystring');
var http = require('http');

exports.test = function(cb) {
    var rosetteApi = new RosetteApi(ConfigServer.rosetteApi.key);
    var endpoint = "relationships";
    var content = "Original Ghostbuster Dan Aykroyd, who also co-wrote the 1984 Ghostbusters film, couldn’t be more pleased with the new all-female Ghostbusters cast, telling The Hollywood Reporter, “The Aykroyd family is delighted by this inheritance of the Ghostbusters torch by these most magnificent women in comedy.”";
    var language = "eng";
    rosetteApi.parameters.content = content;
    rosetteApi.parameters.language = language;

    rosetteApi.rosette(endpoint, function(err, res){
        if(err){
            cb(err);
        } else {
            cb(JSON.stringify(res, null, 2));
        };

    });
}

//9d02838883a842b3a2cd039f3df66eb1

//http://api.meaningcloud.com/topics-2.0

exports.test2 = function(cb) {
    var post_data = querystring.stringify({
        "key": "9d02838883a842b3a2cd039f3df66eb1",
        "lang": "es",
        "tt": "a",
        "txt": "Cuando escribís en un grupo de WhatsApp y nadie te responde 😠📱  @barilirodolfo"
    });
    var post_options = {
        host: 'api.meaningcloud.com',
        port: '80',
        path: '/topics-2.0',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
        }
    };

    var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      var resp = "";
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
          resp += chunk;
      });
      res.on('end', function (chunk) {
          var parsed = {};
          try {
              parsed = JSON.parse(resp);
          } catch (e) {
              console.log("fail");
          }
          cb(parsed);
      });
  });

  post_req.write(post_data);
  post_req.end();
}
