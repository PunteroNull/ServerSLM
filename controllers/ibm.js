var AlchemyAPI = require('../alchemyapi.js');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/local'; //Sacarlo a un config
var arrayFinds = [];
var arrayWords = [];
var dbMongo;
var emailSender = require('../helpers/emailSender');

exports.analyzeText = function(text,cb) { //Analiza texto, luego envia un mail con un codigo y guarda los resultados
    var code = makeRandomCode();
    var alchemyapi = new AlchemyAPI();
    alchemyapi.taxonomy('text', text,{ 'sentiment':0 }, function(response) {
        var tax = response;
        alchemyapi.keywords('text', text,{ 'sentiment':0,"keywordExtractMode":"strict","outputMode":"json","maxRetrieve":20 }, function(response) {
            processData({"taxonomy":tax,"keywords":response},function(result){
                sendCode(code);
                saveResult(result, code);
            });
        });
    });
};

exports.analyzeMultipleText = function(textUser,textsFriends,cb) { //Analiza el texto del usuario y de los usuarios que sigue, luego envia un mail con un codigo y guarda los resultados (Incompleto)
    var code = makeRandomCode();
    alchemyProccessText(textUser,function(err,processedUser){
        async.mapSeries(textsFriends, alchemyProccessText, function(err, processedFriends){
            if(err)
                return console.log(err);
            else
                processMultipleData(processedUser, processedFriends, function(result){
                    sendCode(code);
                    saveResult(result, code);
                });
        })
    })
};

function alchemyProccessText (text,cb){
    var alchemyapi = new AlchemyAPI();
    alchemyapi.taxonomy('text', text,{ 'sentiment':0 }, function(response) {
        var tax = response;
        if(response.status == "ERROR")
            console.log("FALLO TAX");
        alchemyapi.keywords('text', text,{ 'sentiment':0,"keywordExtractMode":"strict","outputMode":"json","maxRetrieve":20 }, function(response) {
            if(response.status == "ERROR")
                console.log("FALLO KEY");
            setTimeout(function(){
                cb(null,{"taxonomy":tax,"keywords":response});
            },2000)
        });
    });
}

exports.test = function(cb) { //Para usar el dato de prueba y no usar alchemy
    processData({"taxonomy":testData.taxonomy,"keywords":testData.keywords},cb);
};

exports.getResult = function(code,cb) { //Para traer los resultados
    MongoClient.connect(url, function(err, db) {
        if(err)
            return cb(err);
        var collection = db.collection('results');
        dbMongo = db;
        collection.find({'code': { $eq: code }}).toArray(function(err, docs) {
            db.close();
            if(err)
                return cb(err);
            if(!docs[0] || !docs[0].result)
                return cb({})
            return cb(docs[0].result);
        });
    });
};

exports.feedback = function(input,callback) {
    var categories = input.categories;
    var keywords = input.keywords
    var note = input.note;
    MongoClient.connect(url, function(err, db) {
        var collection = db.collection('newkeywords');
        dbMongo = db;
        function prepareCategories(category,cb){
            findAndEditCategories(collection,category,keywords,note,cb)
        }
        async.map(categories,prepareCategories,function(err, results){
            db.close();
            return callback(results);
        })
    });
}

exports.feedbackByCode = function(input,callback) {
    //Se puede hacer feedback por el codigo del resultado
}

function sendCode(code){
    var content = {
        from: '"Mr.Tesis 👥" <malcolmtec@gmail.com>',
        to: 'malcolmtec@gmail.com',
        subject: 'Resultado ✔',
        text: "Tu codigo es "+code,
        html: "<b>Tu codigo es "+code+"</b>"
    };
    emailSender.emailSend(content,function(err, resp){
        if(err)
            console.log(err);
        else
            console.log('Mail enviado');
    })
}

function saveResult(result, code){
    MongoClient.connect(url, function(err, db) {
        var collection = db.collection('results');
        dbMongo = db;
        var aux = {
            "code":code,
            "result":result
        }
        collection.insert(aux,function(err, docs) {
            if(err)
                console.log(err);
            else
                console.log("Resultados Guardados");
            db.close();
            return;
        })
    });
}

function findAndEditCategories(collection,category,keywords,note,cb){
    collection.find({'category': { $eq: category }}).toArray(function(err, docs) {
        if(err)
            return cb(err);
        if(_.isEmpty(docs[0])){
            var aux = {
                "category" : category,
                "word" : []
            }
            keywords.forEach(function(word){
                aux.word.push({"name":word,"score":1})
            })
            collection.insert(aux,function(err, docs) {
                if(err)
                    return cb(err);
                return cb(null,docs);
            })
        } else {
            var wordsAux = docs[0].word;
            var index;
            keywords.forEach(function(word){
                index = _.findIndex(wordsAux, function(wordDB){ return wordDB.name == word});
                if(index != -1){
                    wordsAux[index].score = wordsAux[index].score + GlobalConfig.scoreKeywords[note];
                } else {
                    wordsAux.push({"name":word,"score":1})
                }
            })
            collection.update({_id:docs[0]["_id"]}, {$set:{word:wordsAux}},function(err, docs) {
                if(err)
                    return cb(err);
                return cb(null,docs);
            })
        }
    });
}

function processData(data,cb){
    processTaxonomy(data.taxonomy,function(respTax){
        processKeywords(data.keywords,function(respKey){
            finalProcess(respTax,respKey,function(finalResp){
                var resp = {
                    "finalResp":finalResp,
                    "respTaxonomy":respTax,
                    "respKeywords":respKey
                }
                if(data.keywords && data.keywords.keywords && !_.isEmpty(data.keywords.keywords))
                    resp.keywords = data.keywords.keywords;
                cb(resp);
            });
        })
    })
}

function processMultipleData(processedUser, processedFriends ,cb){
    processTaxonomy(processedUser.taxonomy,function(respTaxUser){
        processKeywords(processedUser.keywords,function(respKeyUser){
            finalProcess(respTaxUser,respKeyUser,function(finalRespUser){
                var taxonomyArray = _.pluck(processedFriends, 'taxonomy');
                var keywordsArray = _.pluck(processedFriends, 'keywords');
                async.map(taxonomyArray,processTaxonomyFriend,function(err,respTaxFriends){
                    async.map(taxonomyArray,processKeywordsFriend,function(err,respKeyFriends){
                        var result = finalProcessFriends(respTaxFriends,respKeyFriends,finalRespUser);
                        var keywords = concatKeywordsFriends(processedUser.keywords,keywordsArray);
                        var resp = {
                            "finalResp":result,
                            "keywords":keywords
                        }
                        return cb(resp);
                    })
                })
            });
        })
    })
}

function processTaxonomyFriend(taxData,cb){
    processTaxonomy(taxData,function(resp){
        cb(null,resp)
    });
}

function processKeywordsFriend(keyData,cb){
    processKeywords(keyData,function(resp){
        cb(null,resp)
    });
}

function concatKeywordsFriends(keywordsUser,arrayFriends){
    var keywords = [];
    keywordsUser.keywords.forEach(function(keyword){
        var foundKey = keywords.find(function(key){return key == keyword.text})
        if(!foundKey)
            keywords.push(keyword.text);
    })
    arrayFriends.forEach(function(friendData){
        friendData.keywords.forEach(function(keyword){
            var foundKey = keywords.find(function(key){return key == keyword.text})
            if(!foundKey)
                keywords.push(keyword.text);
        })
    })
    return keywords;
}

function cleanKeyword(keyword){
    return keyword.replace("RT", "").toLowerCase().trim();
}

function processTaxonomy(taxData,cb){
    if(taxData.status == "OK"){
        var tierCollection = {
            "1":[],
            "2":[],
            "3":[],
            "4":[],
            "5":[],
        }
        var separatedLabels;
        taxData.taxonomy.forEach(function(result){
            if(result.score >= GlobalConfig.minScoreTaxonomy){
                separatedLabels = result.label.split("/");
                for (var i = 1; i < separatedLabels.length; i++) {
                    tierCollection[i].push({"label":separatedLabels[i],"score":result.score});
                }
            }
        })
        var sorted = sortTax(tierCollection);
        var scoredCat = [];
        for (var i = 0; i < sorted.length && i < 5; i++) {
            scoredCat.push({"cat":sorted[i],"score":(5-i)})
        }
        cb(scoredCat);
    } else {
        cb([]);
    }
}

function sortTax(tierCollection){
    var categories = [];
    for (var i = 1; i <= 5; i++) {
        var sortedTier = sortTier(tierCollection[i]);
        categories = _.union(categories,sortedTier)
    }
    return categories.reverse();
}

function sortTier(Tier){
    return _.uniq(_.pluck(_.sortBy(Tier, 'score'), 'label'));
}

function processKeywords(keyData,cb){
    if(keyData.status == "OK"){
        var filteredWords = _.pluck(_.filter(keyData.keywords, function(keyword){
            if(keyword.relevance >= GlobalConfig.minScoreKeywords){
                keyword.text = cleanKeyword(keyword.text)
                if(keyword.text && !_.isEmpty(keyword.text))
                    return true;
                else
                    return false;
            } else
                return false;
        }), 'text');
        searchWords(filteredWords,function(results){
            cb(results);
        })
    } else {
        cb([]);
    }
}

function finalProcess(taxCats,keyCats,cb){
    var aux;
    keyCats.forEach(function(kcat){
        aux = _.findIndex(taxCats,{"cat":kcat.cat})
        if(aux != -1){
            taxCats[aux].score += kcat.score;
        } else {
            taxCats.push(kcat);
        }
    });
    cb(_.sortBy(taxCats, 'score').reverse());
}

function finalProcessFriends(respTaxFriends,respKeyFriends,finalRespUser){
    var result = [];
    var taxonomyComplete = [];
    respTaxFriends.forEach(function(taxArrayFriend){
        taxArrayFriend.forEach(function(taxFriend){
            var findTax = taxonomyComplete.find(function(tax){ return tax.cat == taxFriend.cat });
            if(findTax)
                findTax.score = findTax.score + taxFriend.score;
            else
                taxonomyComplete.push(taxFriend)
        })
    })
    respKeyFriends.forEach(function(keyArrayFriend){
        keyArrayFriend.forEach(function(keyFriend){
            var findTax = taxonomyComplete.find(function(tax){ return tax.cat == keyFriend.cat });
            if(findTax)
                findTax.score = findTax.score + keyFriend.score;
            else
                taxonomyComplete.push(keyFriend)
        })
    })
    finalRespUser.forEach(function(userResult){
        var findTax = taxonomyComplete.find(function(tax){ return tax.cat == userResult.cat });
        if(findTax)
            findTax.score = findTax.score + userResult.score*2;
        else {
            userResult.score = userResult.score*2;
            taxonomyComplete.push(userResult)
        }

    })
    return (_.sortBy(taxonomyComplete, 'score').reverse());
}

function searchWords(filteredWords,cb){
    arrayFinds = [];
    var arrayFunc = [];
    arrayWords = filteredWords;
    MongoClient.connect(url, function(err, db) {
        var collection = db.collection('newkeywords');
        dbMongo = db;
        filteredWords.forEach(function(word){
            arrayFunc.push(findWord);
        })
        async.series(arrayFunc,function(err, results){
            db.close();
            if(err || !results || !results[0])
                return cb([]);
            var sortedCats = _.sortBy(arrayFinds, 'amount');
            var finalResults = [];
            for (var i = 0; i < 3; i++) {
                if(sortedCats[i])
                    finalResults.push({"cat":sortedCats[i].cat,"score":(3-i)})
            }
            cb(finalResults);
        })
    });
}

function findWord(cb){
    var word = arrayWords.shift();
    var collection = dbMongo.collection('newkeywords');
    collection.find({'word': {$elemMatch:{name: word}}}).toArray(function(err, docs) {
        if(err){
            console.log(err);
            return cb(null,null);
        }
        var aux;
        var foundedWord;
        docs.forEach(function(foundedDoc){
            aux = _.findIndex(arrayFinds,{"cat":foundedDoc.category})
            foundedWord = _.find(foundedDoc.word, function(w){ return w.name == word; })
            if(aux != -1){
                arrayFinds[aux].amount += foundedWord.score;
            } else {
                arrayFinds.push({"cat":foundedDoc.category,"amount":foundedWord.score});
            }
        });
        cb(null,docs);
    });
}

function makeRandomCode() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

var testData = {
  "taxonomy": {
    "status": "OK",
    "usage": "By accessing AlchemyAPI or using information generated by AlchemyAPI, you are agreeing to be bound by the AlchemyAPI Terms of Use: http://www.alchemyapi.com/company/terms.html",
    "totalTransactions": "1",
    "language": "english",
    "taxonomy": [
      {
        "label": "/technology and computing/consumer electronics/game systems and consoles/nintendo",
        "score": "0.49744"
      },
      {
        "confident": "no",
        "label": "/technology and computing/hardware/computer networking/router",
        "score": "0.480991"
      },
      {
        "confident": "no",
        "label": "/shopping/gifts",
        "score": "0.379151"
      }
    ]
  },
  "keywords": {
    "status": "OK",
    "usage": "By accessing AlchemyAPI or using information generated by AlchemyAPI, you are agreeing to be bound by the AlchemyAPI Terms of Use: http://www.alchemyapi.com/company/terms.html",
    "totalTransactions": "1",
    "language": "english",
    "keywords": [
      {
        "relevance": "0.955715",
        "text": "golf"
      },
      {
        "relevance": "0.812395",
        "text": "titanic"
      },
      {
        "relevance": "0.629331",
        "text": "batman"
      },
      {
        "relevance": "0.614239",
        "text": "shantae"
      },
      {
        "relevance": "0.453485",
        "text": "holiday season"
      },
      {
        "relevance": "0.417086",
        "text": "basquet"
      },
      {
        "relevance": "0.407592",
        "text": "futbol"
      },
      {
        "relevance": "0.404697",
        "text": "taekwondo"
      },
      {
        "relevance": "0.387099",
        "text": "Winter Sale"
      },
      {
        "relevance": "0.384078",
        "text": "release date"
      },
      {
        "relevance": "0.355408",
        "text": "Better not POUT"
      },
      {
        "relevance": "0.349921",
        "text": "Shantae Half Genie"
      },
      {
        "relevance": "0.348267",
        "text": "wonderful time"
      },
      {
        "relevance": "0.342534",
        "text": "Rescue Girl"
      },
      {
        "relevance": "0.339893",
        "text": "RT  Shantae"
      },
      {
        "relevance": "0.338681",
        "text": "cross buy options"
      },
      {
        "relevance": "0.338427",
        "text": "contact support"
      },
      {
        "relevance": "0.338283",
        "text": "Bring home"
      },
      {
        "relevance": "0.331669",
        "text": "com"
      },
      {
        "relevance": "0.32788",
        "text": "Half Genie Hero"
      },
      {
        "relevance": "0.323261",
        "text": "3DS eShop"
      },
      {
        "relevance": "0.318781",
        "text": "RT    New action"
      },
      {
        "relevance": "0.318115",
        "text": "Revenge"
      },
      {
        "relevance": "0.314476",
        "text": "Shantae pirate redesign"
      },
      {
        "relevance": "0.303945",
        "text": "RT  Mighty Switch"
      },
      {
        "relevance": "0.296426",
        "text": "PiratesCurse"
      },
      {
        "relevance": "0.29609",
        "text": "shantae character drawings"
      },
      {
        "relevance": "0.293028",
        "text": "Revenge DC eShop"
      }
    ]
  }
}
