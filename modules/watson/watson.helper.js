const MongoClient = require('mongodb').MongoClient;
const emailSender = require('../../helpers/emailSender');
let arrayFinds = [];
let arrayWords = [];

exports.processTaxonomy = function(taxData, cb) {
    if (!taxData || !taxData.categories) {
        return cb([]);
    }

    if (taxData.status == "OK") {
        let tierCollection = {"1": [], "2": [], "3": [], "4": [], "5": []}
        let separatedLabels;

        taxData.categories.forEach(function(result) {
            if (result && result.score >= ConfigServer.values.minScoreTaxonomy && result.label) {
                separatedLabels = result.label.split("/");

                for (let i = 1; i < separatedLabels.length; i++) {
                    tierCollection[i].push({
                        label: separatedLabels[i],
                        score: result.score
                    });
                }
            }
        })

        let sorted = sortTax(tierCollection);
        let scoredCat = [];

        for (let i = 0; i < sorted.length && i < 5; i++) {
            scoredCat.push({
                cat: sorted[i],
                score: (5 - i)
            })
        }

        return cb(scoredCat);
    } else {
        return cb([]);
    }
}

exports.processKeywords = function (keyData, cb) {
    if (keyData && keyData.status == "OK" && keyData.keywords) {
        let filteredWords = _.pluck(_.filter(keyData.keywords, function(keyword) {
            if (keyword.relevance >= ConfigServer.values.minScoreKeywords) {
                keyword.text = cleanKeyword(keyword.text);

                if (keyword.text && !_.isEmpty(keyword.text)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }), 'text');

        searchWords(filteredWords, function(results) {
            return cb(results);
        });
    } else {
        return cb([]);
    }
}

exports.finalProcess = function (taxCats, keyCats, cb) {
    if (!keyCats) {
        if (!taxCats || !taxCats.length) {
            return cb([]);
        }

        return cb(_.sortBy(taxCats, 'score').reverse());
    }

    let aux;

    keyCats.forEach(function(kcat) {
        aux = _.findIndex(taxCats, {
            "cat": kcat.cat
        });

        if (aux != -1 && taxCats[aux] !== undefined) {
            taxCats[aux].score += kcat.score;
        } else {
            taxCats.push(kcat);
        }
    });

    return cb(_.sortBy(taxCats, 'score').reverse());
}

exports.sendCode = function(code, email) {
    let content = {
        from: '"Social Life Manager Results" <malcolmtec@gmail.com>',
        to: email ? email : 'malcolmtec@gmail.com',
        subject: 'Resultado ✔',
        text: "Tu codigo es " + code +" . Introducelo en Social Life Manager para ver tus resultados",
        html: "<b>Tu codigo es " + code +" . Introducelo en Social Life Manager para ver tus resultados</b>"
    };

    emailSender.emailSend(content, function(err, resp) {
        if (err) {
            console.log(err);
            console.log("[ERROR] No pudo enviarse el email (Codigo: " + code + ")");
        } else {
            console.log('[INFO] Email enviado con exito (Codigo: ' + code + ')');
        }
    })
}

exports.saveResult = function (username, result, code) {
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err || !db) {
            return console.log("[ERROR] No se pudo conectar a MongoDB para guardar los resultados");
        }

        let collection = db.collection('results');
        dbMongo = db;
        let now = new Date();
        let aux = {
            "code": code,
            "result": result,
            "date": now,
            "username": username
        }

        collection.insert(aux, function(err, docs) {
            db.close();

            if (err) {
                return console.log("[ERROR] No se pudo guardar los resultados en MongoDB");
            } else {
                return console.log("[INFO] Resultados guardados con exito");
            }
        })
    });
}

exports.makeRandomCode = function() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

exports.finalProcessFriends = function(respTaxFriends, respKeyFriends, finalRespUser) {
    let taxonomyComplete = [];

    respTaxFriends.forEach(function(taxArrayFriend) {
        taxArrayFriend.forEach(function(taxFriend) {
            let findTax = taxonomyComplete.find(function(tax) {
                return tax.cat == taxFriend.cat
            });

            if (findTax) {
                findTax.score = findTax.score + taxFriend.score;
            } else {
                taxonomyComplete.push(taxFriend);
            }
        })
    });

    respKeyFriends.forEach(function(keyArrayFriend) {
        keyArrayFriend.forEach(function(keyFriend) {
            let findTax = taxonomyComplete.find(function(tax) {
                return tax.cat == keyFriend.cat
            });

            if (findTax) {
                findTax.score = findTax.score + keyFriend.score;
            } else {
                taxonomyComplete.push(keyFriend);
            }
        })
    });

    finalRespUser.forEach(function(userResult) {
        let findTax = taxonomyComplete.find(function(tax) {
            return tax.cat == userResult.cat;
        });

        if (findTax) {
            findTax.score = findTax.score + userResult.score * 5;
        } else {
            userResult.score = userResult.score * 5;
            taxonomyComplete.push(userResult);
        }
    });

    return (_.sortBy(taxonomyComplete, 'score').reverse());
}

exports.concatKeywordsFriends = function(keywordsUser, arrayFriends) {
    if (!arrayFriends || !arrayFriends.length) {
        return [];
    }

    let keywords = [];

    if (keywordsUser && keywordsUser.keywords) {
        keywordsUser.keywords.forEach(function(keyword) {
            let foundKey = keywords.find(function(key) {
                return key == keyword.text;
            });

            if (!foundKey) {
                keywords.push(keyword.text);
            }
        });
    }

    arrayFriends.forEach(function(friendData) {
        if (friendData && friendData.keywords) {
            friendData.keywords.forEach(function(keyword) {
                let foundKey = keywords.find(function(key) {
                    return key == keyword.text;
                });

                if (!foundKey) {
                    keywords.push(keyword.text);
                }
            })
        }
    });

    return _.uniq(keywords);
}

exports.transformRosToAlch = function(entities) {
    let keywords = { status: "OK", language: "english", keywords: [] };

    entities.forEach(function(entity){
        if (entity && entity.relevance && entity.form) {
            keywords.keywords.push({ relevance: (entity.relevance / 100), text: entity.form });
        }
    });

    return keywords;
}

function sortTax(tierCollection) {
    let categories = [];

    for (let i = 1; i <= 5; i++) {
        let sortedTier = sortTier(tierCollection[i]);
        categories = _.union(categories, sortedTier);
    }

    return categories.reverse();
}

function searchWords(filteredWords, cb) {
    if (!filteredWords || !filteredWords.length) {
        console.log("[INFO] No habia palabras con que trabajar");
        return cb([]);
    }

    arrayFinds = [];
    let arrayFunc = [];
    arrayWords = filteredWords;

    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err || !db) {
            console.log("[ERROR] No se pudo conectar a MongoDB");
            return cb([]);
        }

        dbMongo = db;
        filteredWords.forEach(function(word) {
            arrayFunc.push(findWord);
        });

        async.series(arrayFunc, function(err, results) {
            db.close();

            if (err || !results || !results[0]) {
                console.log("[ERROR] No se pudieron buscar las palabras en MongoDB");
                return cb([]);
            }

            let sortedCats = _.sortBy(arrayFinds, 'amount');
            let finalResults = [];

            for (let i = 0; i < 3; i++) {
                if (sortedCats[i]) {
                    finalResults.push({
                        cat: sortedCats[i].cat,
                        score: (3 - i)
                    });
                }
            }

            return cb(finalResults);
        })
    });
}

function finalProcess(taxCats, keyCats, cb) {
    if (!keyCats) {
        if (!taxCats || !taxCats.length) {
            return cb([]);
        }

        return cb(_.sortBy(taxCats, 'score').reverse());
    }

    let aux;

    keyCats.forEach(function(kcat) {
        aux = _.findIndex(taxCats, {
            cat: kcat.cat
        });

        if (aux != -1) {
            taxCats[aux].score += kcat.score;
        } else {
            taxCats.push(kcat);
        }
    });

    return cb(_.sortBy(taxCats, 'score').reverse());
}

function sortTier(tier) {
    return _.uniq(_.pluck(_.sortBy(tier, 'score'), 'label'));
}

function cleanKeyword(keyword) {
    if (!keyword) {
        return '';
    }

    return keyword.replace("RT", "").toLowerCase().trim();
}

function findWord(cb) {
    let word = arrayWords.shift();
    let collection = dbMongo.collection('categories');

    collection.find({'keywords': {$elemMatch: {'name': word}}}).toArray(function(err, docs) {
        if (err || !docs) {
            console.log("[ERROR] No se pudieron obtener las palabras claves de las categorias");
            return cb(null, null);
        }

        if (!docs.length) {
            return cb(null, docs);
        }

        let aux;
        let foundedWord;

        docs.forEach(function(foundedDoc) {
            aux = _.findIndex(arrayFinds, {
                cat: foundedDoc.name
            });

            foundedWord = _.find(foundedDoc.keywords, function(w) {
                return w.name == word;
            });

            if (aux != -1) {
                arrayFinds[aux].amount += foundedWord.score;
            } else {
                arrayFinds.push({
                    cat: foundedDoc.name,
                    amount: foundedWord.score
                });
            }
        });

        return cb(null, docs);
    });
}
