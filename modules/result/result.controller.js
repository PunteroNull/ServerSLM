var MongoClient = require('mongodb').MongoClient;
//Para traer los resultados
exports.getResult = function(code, cb) {
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err)
            return cb(err);
        var collection = db.collection('results');
        collection.find({'code': {$eq: code}}).toArray(function(err, docs) {
            db.close();
            if (err)
                return cb(err);
            if (!docs[0] || !docs[0].result)
                return cb({})
            return cb(docs[0].result);
        });
    });
};

exports.getResultByUser = function(username, cb) {
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err)
            return cb(err);
        var maxDay = moment().subtract(ConfigServer.values.maxDaysCached, 'days').toDate();
        var collection = db.collection('results');
        collection.find({'username': {$eq: username},"date" : { $gte : maxDay }}).toArray(function(err, docs) {
            db.close();
            if (err)
                return cb(err);
            if (!docs[0] || !docs[0].result)
                return cb(null, {})

            var result = {
                "code":docs[0].code,
                "result":docs[0].result
            }
            return cb(null, result);
        });
    });
};

exports.feedback = function(input, callback) {
    var categories = input.categories;
    var keywords = input.keywords
    var note = input.note;
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        var collection = db.collection('newkeywords');

        function prepareCategories(category, cb) {
            findAndEditCategories(collection, category, keywords, note, cb)
        }
        async.map(categories, prepareCategories, function(err, results) {
            db.close();
            return callback(results);
        })
    });
}

function findAndEditCategories(collection, category, keywords, note, cb) {
    collection.find({'category': {$eq: category}}).toArray(function(err, docs) {
        if (err)
            return cb(err);
        if (_.isEmpty(docs[0])) {
            var aux = {
                "category": category,
                "word": []
            }
            keywords.forEach(function(word) {
                aux.word.push({
                    "name": word,
                    "score": 1
                })
            })
            collection.insert(aux, function(err, docs) {
                if (err)
                    return cb(err);
                return cb(null, docs);
            })
        } else {
            var wordsAux = docs[0].word;
            var index;
            keywords.forEach(function(word) {
                index = _.findIndex(wordsAux, function(wordDB) {
                    return wordDB.name == word
                });
                if (index != -1) {
                    wordsAux[index].score = wordsAux[index].score + GlobalConfig.scoreKeywords[note];
                } else {
                    wordsAux.push({
                        "name": word,
                        "score": 1
                    })
                }
            })
            collection.update({_id: docs[0]["_id"]}, {$set: {word: wordsAux}}, function(err, docs) {
                if (err)
                    return cb(err);
                return cb(null, docs);
            })
        }
    });
}
