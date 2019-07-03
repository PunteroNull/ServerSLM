const watsonHelper = require('./watson.helper.js');
const categoryController = require('../category/category.controller.js');
const querystring = require('querystring');
const http = require('http');
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');

let nlu = new NaturalLanguageUnderstandingV1(ConfigServer.watson);

function alchemyProccessTextAlt(text, cb) { //Analiza texto, luego envia un mail con un codigo y guarda los resultados
    nlu.analyze({
        'text': text,
        'features': {
            "categories": {}
        }
    }, function(err, response) {
        let tax;

        if (err) {
            console.log("[ERROR] No se pudo analizar el texto");
            console.log(err);
            tax = { status: "ERROR", language: 'en' };
        } else {
            console.log("[DEBUG] Obtenido analisis del texto");
            console.log(response);
            tax = response;
            tax.status = "OK";
        }

        let language;

        switch (tax.language) {
            case 'english':
                language = 'en';
                break;
            case 'spanish':
                language = 'es';
                break;
            default:
                language = 'en';
        }

        let post_data = querystring.stringify({
            key: ConfigServer.meaningcloud.key,
            lang: language,
            tt: "a",
            txt: text
        });

        let post_options = {
            host: 'api.meaningcloud.com',
            port: '80',
            path: '/topics-2.0',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(post_data)
            }
        };

        let post_req = http.request(post_options, function(res) {
            res.setEncoding('utf8');
            let resp = "";

            res.on('data', function(chunk) {
                resp += chunk;
            });

            res.on('end', function() {
                let parsedKeys;

                try {
                    parsedKeys = JSON.parse(resp);
                } catch (e) {
                    console.log("[ERROR] No se pudo parsear la respuesta de MeaningCloud");
                }

                let keywords;

                if(parsedKeys && parsedKeys.entity_list) {
                    keywords = watsonHelper.transformRosToAlch(parsedKeys.entity_list);
                } else {
                    keywords = { status: "FAIL" };
                }

                return cb(null, { taxonomy: tax, keywords: keywords });
            });
        });

        post_req.write(post_data);
        post_req.end();
    });
};

exports.analyzeMultipleTextAlt = function(username, textUser, textsFriends, email, cb) { //Analiza el texto del usuario y de los usuarios que sigue, luego envia un mail con un codigo y guarda los resultados (Incompleto)
    let code = watsonHelper.makeRandomCode();

    alchemyProccessTextAlt(textUser, function(err, processedUser) {
        if (err) {
            console.log("[ERROR] No puedo analizar texto del usuario");
            return console.log(err);
        }

        async.mapLimit(textsFriends, 3, alchemyProccessTextAlt, function(err, processedFriends) {
            if (err) {
                console.log("[ERROR] No puedo analizar textos de amigos");
                return console.log(err);
            } else {
                processMultipleData(processedUser, processedFriends, function(result) {
                    watsonHelper.sendCode(code, email);
                    watsonHelper.saveResult(username, result, code);

                    if(result.finalResp) {
                        categoryController.saveRelations(result.finalResp);
                    }
                });
            }
        })
    })
};

function processMultipleData(processedUser, processedFriends, callback) {
    async.waterfall([
        function(cb){
            watsonHelper.processTaxonomy(processedUser.taxonomy, function(respTaxUser) {
                return cb(null, respTaxUser);
            })
        },
        function(respTaxUser, cb){
            watsonHelper.processKeywords(processedUser.keywords, function(respKeyUser) {
                return cb(null, respTaxUser, respKeyUser);
            })
        },
        function(respTaxUser, respKeyUser, cb){
            watsonHelper.finalProcess(respTaxUser, respKeyUser, function(finalRespUser) {
                return cb(null, finalRespUser);
            });
        },
        function(finalRespUser, cb){
            let taxonomyArray = _.pluck(processedFriends, 'taxonomy');
            let keywordsArray = _.pluck(processedFriends, 'keywords');

            async.map(taxonomyArray, processTaxonomyFriend, function(err, respTaxFriends) {
                if (err) {
                    console.log("[ERROR] Hubo errores al procesar la taxonomia de los textos");
                }

                async.map(taxonomyArray, processKeywordsFriend, function(err, respKeyFriends) {
                    if (err) {
                        console.log("[ERROR] Hubo errores al pracesar las palabras claves");
                    }

                    let result = watsonHelper.finalProcessFriends(respTaxFriends, respKeyFriends, finalRespUser);
                    let keywords = watsonHelper.concatKeywordsFriends(processedUser.keywords, keywordsArray);
                    let resp = {
                        finalResp: result,
                        keywords: keywords
                    }

                    return cb(null, resp);
                })
            })
        }
    ],function(err, results){
        return callback(results);
    });
}

function processTaxonomyFriend(taxData, cb) {
    watsonHelper.processTaxonomy(taxData, function(resp) {
        return cb(null, resp)
    });
}

function processKeywordsFriend(keyData, cb) {
    watsonHelper.processKeywords(keyData, function(resp) {
        cb(null, resp)
    });
}
