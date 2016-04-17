var AlchemyAPI = require('../alchemyapi.js');
var alchemyapi = new AlchemyAPI();
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = 'mongodb://localhost:27017/local';
var arrayFinds = [];
var arrayWords = [];
var dbMongo;

exports.analyzeText = function(text,cb) {
    alchemyapi.taxonomy('text', text,{ 'sentiment':0 }, function(response) {
        var tax = response;
        alchemyapi.keywords('text', text,{ 'sentiment':0,"keywordExtractMode":"strict","outputMode":"json","maxRetrieve":20 }, function(response) {
            processData({"taxonomy":tax,"keywords":response},cb);
        });
    });
};

exports.test = function(cb) {
    processData({"taxonomy":testData.taxonomy,"keywords":testData.keywords},cb);
};

exports.feedback = function(input,callback) {
    var categories = input.categories;
    var keywords = input.keywords
    var note = input.note;
    MongoClient.connect(url, function(err, db) {
        var collection = db.collection('newkeywords');
        dbMongo = db;
        function prepareCategories(category,cb){
            findAndEditCategories(collection,category,keywords,cb)
        }
        async.map(categories,prepareCategories,function(err, results){
            db.close();
            return callback(results);
        })
    });
    //Toma 5 palabras clave, 3 categorias y la nota
    //A cada categoria agrega las claves
    //Las nuevas le pone 1
    //Las viejas le suma o resta score
    //Como mucho son 15 actualizaciones
}

function findAndEditCategories(collection,category,keywords,cb){
    collection.find({'category': { $eq: category }}).toArray(function(err, docs) {
        console.log(docs);
        if(err)
            return cb(err);
        return cb(null,docs);
    });
}

function processData(data,cb){
    // console.log(data);
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
                cb([]);
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
        if(err)
            return cb(null,null);
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
      },
      {
        "relevance": "0.292712",
        "text": "Nintendo sales"
      },
      {
        "relevance": "0.292338",
        "text": "Shantae Half-Genie Hero"
      },
      {
        "relevance": "0.288177",
        "text": "lovely Lego Shantae"
      },
      {
        "relevance": "0.287966",
        "text": "New Year Sale"
      },
      {
        "relevance": "0.287264",
        "text": "publisher"
      },
      {
        "relevance": "0.286254",
        "text": "Revenge Director"
      },
      {
        "relevance": "0.285583",
        "text": "game support issues"
      },
      {
        "relevance": "0.282935",
        "text": "specific release date"
      },
      {
        "relevance": "0.282188",
        "text": "specific date"
      },
      {
        "relevance": "0.281792",
        "text": "ports"
      },
      {
        "relevance": "0.281391",
        "text": "TBA"
      },
      {
        "relevance": "0.280573",
        "text": "fan art"
      },
      {
        "relevance": "0.279128",
        "text": "Shantae game"
      },
      {
        "relevance": "0.278639",
        "text": "backer tier reward"
      },
      {
        "relevance": "0.277828",
        "text": "current estimated date"
      },
      {
        "relevance": "0.277267",
        "text": "Backer exclusive items"
      },
      {
        "relevance": "0.277214",
        "text": "RT  Oh"
      },
      {
        "relevance": "0.277098",
        "text": "little fan art"
      },
      {
        "relevance": "0.275948",
        "text": "Lunar New"
      },
      {
        "relevance": "0.275491",
        "text": "lovely little Half-Genie"
      }
    ]
  }
}
