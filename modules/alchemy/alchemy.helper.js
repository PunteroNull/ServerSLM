var MongoClient = require('mongodb').MongoClient;
var arrayFinds = [];
var arrayWords = [];
var emailSender = require('../../helpers/emailSender');

exports.processTaxonomy = function(taxData, cb) {
    if (taxData.status == "OK") {
        var tierCollection = {"1": [], "2": [], "3": [], "4": [], "5": []}
        var separatedLabels;
        taxData.taxonomy.forEach(function(result) {
            if (result.score >= ConfigServer.values.minScoreTaxonomy) {
                separatedLabels = result.label.split("/");
                for (var i = 1; i < separatedLabels.length; i++) {
                    tierCollection[i].push({
                        "label": separatedLabels[i],
                        "score": result.score
                    });
                }
            }
        })
        var sorted = sortTax(tierCollection);
        var scoredCat = [];
        for (var i = 0; i < sorted.length && i < 5; i++) {
            scoredCat.push({
                "cat": sorted[i],
                "score": (5 - i)
            })
        }
        cb(scoredCat);
    } else {
        cb([]);
    }
}

exports.processKeywords = function (keyData, cb) {
    if (keyData.status == "OK") {
        var filteredWords = _.pluck(_.filter(keyData.keywords, function(keyword) {
            if (keyword.relevance >= ConfigServer.values.minScoreKeywords) {
                keyword.text = cleanKeyword(keyword.text)
                if (keyword.text && !_.isEmpty(keyword.text))
                    return true;
                else
                    return false;
            } else
                return false;
        }), 'text');
        searchWords(filteredWords, function(results) {
            cb(results);
        })
    } else {
        cb([]);
    }
}

exports.finalProcess = function (taxCats, keyCats, cb) {
    var aux;
    keyCats.forEach(function(kcat) {
        aux = _.findIndex(taxCats, {
            "cat": kcat.cat
        })
        if (aux != -1) {
            taxCats[aux].score += kcat.score;
        } else {
            taxCats.push(kcat);
        }
    });
    cb(_.sortBy(taxCats, 'score').reverse());
}

exports.sendCode = function(code, email) {
    var content = {
        from: '"Mr.Tesis 👥" <malcolmtec@gmail.com>',
        to: email ? email : 'malcolmtec@gmail.com',
        subject: 'Resultado ✔',
        text: "Tu codigo es " + code,
        html: "<b>Tu codigo es " + code + "</b>"
    };
    emailSender.emailSend(content, function(err, resp) {
        if (err)
            console.log(err);
        else
            console.log('Mail enviado');
    })
}

exports.saveResult = function (username, result, code) {
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        var collection = db.collection('results');
        dbMongo = db;
        var now = new Date();
        var aux = {
            "code": code,
            "result": result,
            "date": now,
            "username": username
        }
        collection.insert(aux, function(err, docs) {
            if (err)
                console.log(err);
            else
                console.log("Resultados Guardados");
            db.close();
            return;
        })
    });
}

exports.makeRandomCode = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

exports.finalProcessFriends = function(respTaxFriends, respKeyFriends, finalRespUser) {
    var result = [];
    var taxonomyComplete = [];
    respTaxFriends.forEach(function(taxArrayFriend) {
        taxArrayFriend.forEach(function(taxFriend) {
            var findTax = taxonomyComplete.find(function(tax) {
                return tax.cat == taxFriend.cat
            });
            if (findTax)
                findTax.score = findTax.score + taxFriend.score;
            else
                taxonomyComplete.push(taxFriend)
        })
    })
    respKeyFriends.forEach(function(keyArrayFriend) {
        keyArrayFriend.forEach(function(keyFriend) {
            var findTax = taxonomyComplete.find(function(tax) {
                return tax.cat == keyFriend.cat
            });
            if (findTax)
                findTax.score = findTax.score + keyFriend.score;
            else
                taxonomyComplete.push(keyFriend)
        })
    })
    finalRespUser.forEach(function(userResult) {
        var findTax = taxonomyComplete.find(function(tax) {
            return tax.cat == userResult.cat
        });
        if (findTax)
            findTax.score = findTax.score + userResult.score * 2;
        else {
            userResult.score = userResult.score * 2;
            taxonomyComplete.push(userResult)
        }

    })
    return (_.sortBy(taxonomyComplete, 'score').reverse());
}

exports.concatKeywordsFriends = function(keywordsUser, arrayFriends) {
    var keywords = [];
    if (keywordsUser && keywordsUser.keywords)
        keywordsUser.keywords.forEach(function(keyword) {
            var foundKey = keywords.find(function(key) {
                return key == keyword.text
            })
            if (!foundKey)
                keywords.push(keyword.text);
        })
    arrayFriends.forEach(function(friendData) {
        if (friendData && friendData.keywords)
            friendData.keywords.forEach(function(keyword) {
                var foundKey = keywords.find(function(key) {
                    return key == keyword.text
                })
                if (!foundKey)
                    keywords.push(keyword.text);
            })
    })
    return _.uniq(keywords);
}

function sortTax(tierCollection) {
    var categories = [];
    for (var i = 1; i <= 5; i++) {
        var sortedTier = sortTier(tierCollection[i]);
        categories = _.union(categories, sortedTier)
    }
    return categories.reverse();
}

function searchWords(filteredWords, cb) {
    arrayFinds = [];
    var arrayFunc = [];
    arrayWords = filteredWords;
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        var collection = db.collection('newkeywords');
        dbMongo = db;
        filteredWords.forEach(function(word) {
            arrayFunc.push(findWord);
        })
        async.series(arrayFunc, function(err, results) {
            db.close();
            if (err || !results || !results[0])
                return cb([]);
            var sortedCats = _.sortBy(arrayFinds, 'amount');
            var finalResults = [];
            for (var i = 0; i < 3; i++) {
                if (sortedCats[i])
                    finalResults.push({
                        "cat": sortedCats[i].cat,
                        "score": (3 - i)
                    })
            }
            cb(finalResults);
        })
    });
}

function finalProcess(taxCats, keyCats, cb) {
    var aux;
    keyCats.forEach(function(kcat) {
        aux = _.findIndex(taxCats, {
            "cat": kcat.cat
        })
        if (aux != -1) {
            taxCats[aux].score += kcat.score;
        } else {
            taxCats.push(kcat);
        }
    });
    cb(_.sortBy(taxCats, 'score').reverse());
}

function sortTier(Tier) {
    return _.uniq(_.pluck(_.sortBy(Tier, 'score'), 'label'));
}

function cleanKeyword(keyword) {
    return keyword.replace("RT", "").toLowerCase().trim();
}

function findWord(cb) {
    var word = arrayWords.shift();
    var collection = dbMongo.collection('newkeywords');
    collection.find({
        'word': {
            $elemMatch: {
                name: word
            }
        }
    }).toArray(function(err, docs) {
        if (err) {
            console.log(err);
            return cb(null, null);
        }
        var aux;
        var foundedWord;
        docs.forEach(function(foundedDoc) {
            aux = _.findIndex(arrayFinds, {
                "cat": foundedDoc.category
            })
            foundedWord = _.find(foundedDoc.word, function(w) {
                return w.name == word;
            })
            if (aux != -1) {
                arrayFinds[aux].amount += foundedWord.score;
            } else {
                arrayFinds.push({
                    "cat": foundedDoc.category,
                    "amount": foundedWord.score
                });
            }
        });
        cb(null, docs);
    });
}
