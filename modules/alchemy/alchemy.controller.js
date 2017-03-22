var AlchemyAPI = require('../../alchemyapi.js');
var alchemyHelper = require('./alchemy.helper.js');
var categoryController = require('../category/category.controller.js');

var RosetteApi = require('rosette-api');
var querystring = require('querystring');
var http = require('http');

exports.analyzeText = function(username, text, cb) { //Analiza texto, luego envia un mail con un codigo y guarda los resultados
    var code = alchemyHelper.makeRandomCode();
    var alchemyapi = new AlchemyAPI();
    alchemyapi.taxonomy('text', text, {'sentiment': 0}, function(response) {
        var tax = response;
        alchemyapi.keywords('text', text, {'sentiment': 0, "keywordExtractMode": "strict", "outputMode": "json", "maxRetrieve": 20 }, function(response) {
            processData({"taxonomy": tax, "keywords": response}, function(result) {
                alchemyHelper.sendCode(code);
                alchemyHelper.saveResult(username, result, code);
                if(result.finalResp)
                    categoryController.saveRelations(result.finalResp);
            });
        });
    });
};

exports.analyzeMultipleText = function(username, textUser, textsFriends, email, cb) { //Analiza el texto del usuario y de los usuarios que sigue, luego envia un mail con un codigo y guarda los resultados (Incompleto)
    var code = alchemyHelper.makeRandomCode();
    alchemyProccessText(textUser, function(err, processedUser) {
        async.mapLimit(textsFriends, 3, alchemyProccessText, function(err, processedFriends) {
            if (err) {
                return console.log(err);
            } else {
                processMultipleData(processedUser, processedFriends, function(result) {
                    alchemyHelper.sendCode(code, email);
                    alchemyHelper.saveResult(username, result, code);
                    if(result.finalResp)
                        categoryController.saveRelations(result.finalResp);
                });
            }
        })
    })
};

function alchemyProccessText(text, cb) {
    var alchemyapi = new AlchemyAPI();
    alchemyapi.taxonomy('text', text, {'sentiment': 0}, function(response) {
        var tax = response;
        if (response.status == "ERROR")
            console.log(response);
        alchemyapi.keywords('text', text, {'sentiment': 0, "keywordExtractMode": "strict", "outputMode": "json", "maxRetrieve": 20}, function(response) {
            if (response.status == "ERROR")
                console.log(response);
            cb(null, {"taxonomy": tax,"keywords": response});
        });
    });
};

exports.analyzeMultipleTextAlt = function(username, textUser, textsFriends, email, cb) { //Analiza el texto del usuario y de los usuarios que sigue, luego envia un mail con un codigo y guarda los resultados (Incompleto)
    var code = alchemyHelper.makeRandomCode();
    alchemyProccessTextAlt(textUser, function(err, processedUser) {
        async.mapLimit(textsFriends, 3, alchemyProccessTextAlt, function(err, processedFriends) {
            if (err) {
                return console.log(err);
            } else {
                processMultipleData(processedUser, processedFriends, function(result) {
                    alchemyHelper.sendCode(code, email);
                    alchemyHelper.saveResult(username, result, code);
                    if(result.finalResp)
                        categoryController.saveRelations(result.finalResp);
                });
            }
        })
    })
};

function alchemyProccessTextAlt(text, cb) {
    var alchemyapi = new AlchemyAPI();
    alchemyapi.taxonomy('text', text, {'sentiment': 0}, function(response) {
        var tax = response;
        if (response.status == "ERROR")
            console.log(response);

        var language;
        switch (response.language) {
            case 'english':
                    language = 'en';
                break;
            case 'spanish':
                    language = 'es';
                break;
            default:
                language = 'en';
        }

        var post_data = querystring.stringify({
            "key": "9d02838883a842b3a2cd039f3df66eb1", //Config
            "lang": language,
            "tt": "a",
            "txt": text
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
            res.on('data', function(chunk) {
                // console.log('Response: ' + chunk);
                resp += chunk;
            });
            res.on('end', function(chunk) {
                var parsedKeys;
                try {
                    parsedKeys = JSON.parse(resp);
                } catch (e) {
                    console.log("fail");
                }

                var keywords;
                if(parsedKeys && parsedKeys.entity_list)
                    keywords = alchemyHelper.transformRosToAlch(parsedKeys.entity_list);
                else
                    keywords = {"status": "FAIL"};

                cb(null, {"taxonomy": tax,"keywords": keywords});
            });
        });

        post_req.write(post_data);
        post_req.end();
    });
}

function processData(data, callback) {
    async.waterfall([
        function(cb){
            alchemyHelper.processTaxonomy(data.taxonomy, function(respTax) {
                cb(null, respTax);
            });
        },
        function(respTax, cb){
            alchemyHelper.processKeywords(data.keywords, function(respKey) {
                cb(null, respTax, respKey);
            });
        },
        function(respTax, respKey, cb){
            alchemyHelper.finalProcess(respTax, respKey, function(finalResp) {
                cb(null, respTax, respKey, finalResp);
            });
        },
        function(respTax, respKey, finalResp, cb){
            var resp = {
                "finalResp": finalResp,
                "respTaxonomy": respTax,
                "respKeywords": respKey
            }
            if (data.keywords && data.keywords.keywords && !_.isEmpty(data.keywords.keywords))
                resp.keywords = data.keywords.keywords;
            cb(null, resp);
        }
    ],function(err,results){
        callback(results);
    })
}

function processMultipleData(processedUser, processedFriends, callback) {
    async.waterfall([
        function(cb){
            alchemyHelper.processTaxonomy(processedUser.taxonomy, function(respTaxUser) {
                cb(null, respTaxUser);
            })
        },
        function(respTaxUser, cb){
            alchemyHelper.processKeywords(processedUser.keywords, function(respKeyUser) {
                cb(null, respTaxUser, respKeyUser);
            })
        },
        function(respTaxUser, respKeyUser, cb){
            alchemyHelper.finalProcess(respTaxUser, respKeyUser, function(finalRespUser) {
                cb(null, respTaxUser, respKeyUser, finalRespUser);
            });
        },
        function(respTaxUser, respKeyUser, finalRespUser, cb){
            var taxonomyArray = _.pluck(processedFriends, 'taxonomy');
            var keywordsArray = _.pluck(processedFriends, 'keywords');
            async.map(taxonomyArray, processTaxonomyFriend, function(err, respTaxFriends) {
                async.map(taxonomyArray, processKeywordsFriend, function(err, respKeyFriends) {
                    var result = alchemyHelper.finalProcessFriends(respTaxFriends, respKeyFriends, finalRespUser);
                    var keywords = alchemyHelper.concatKeywordsFriends(processedUser.keywords, keywordsArray);
                    var resp = {
                        "finalResp": result,
                        "keywords": keywords
                    }
                    return cb(null, resp);
                })
            })
        }
    ],function(err,results){
        callback(results);
    })

}

function processTaxonomyFriend(taxData, cb) {
    alchemyHelper.processTaxonomy(taxData, function(resp) {
        cb(null, resp)
    });
}

function processKeywordsFriend(keyData, cb) {
    alchemyHelper.processKeywords(keyData, function(resp) {
        cb(null, resp)
    });
}
