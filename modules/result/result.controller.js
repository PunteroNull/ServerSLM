const MongoClient = require('mongodb').MongoClient;
//Para traer los resultados
exports.getResult = function(code, cb) {
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err) {
            console.log("[ERROR] No se pudo conectar a MongoDB");
            return cb(err);
        }
        
        let collection = db.collection('results');

        collection.find({'code': {$eq: code}}).toArray(function(err, docs) {
            db.close();

            if (err) {
                console.log("[ERROR] Error al obtener datos de MongoDB");
                return cb(err);
            }
            
            if (!docs || !docs[0] || !docs[0].result) {
                console.log("[INFO] El codigo provisto no tenia informacion!");
                return cb("ERROR");
            }

            let result = {
                date: docs[0].date,
                username: docs[0].username,
                code: docs[0].code,
                result: docs[0].result
            }

            return cb(null, result);
        });
    });
};

exports.getResultByUser = function(username, cb) {
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err) {
            console.log("[ERROR] No se pudo conectar a MongoDB");
            return cb(err);
        }

        let maxDay = moment().subtract(ConfigServer.values.maxDaysCached, 'days').toDate();
        let collection = db.collection('results');

        collection.find({ username: {$eq: username}, date : { $gte : maxDay } }).toArray(function(err, docs) {
            db.close();

            if (err) {
                console.log("[ERROR] Error al obtener datos de MongoDB");
                return cb(err);
            }

            if (!docs || !docs[0] || !docs[0].result || !docs[0].code) {
                console.log("[INFO] El usuario provisto no tenia informacion previa");
                return cb(null, {})
            }

            console.log(docs[0]);
            
            let result = {
                date: docs[0].date,
                username: docs[0].username,
                code: docs[0].code,
                result: docs[0].result
            }

            return cb(null, result);
        });
    });
};

exports.feedback = function(input, callback) {
    let categories = input.categories;
    let keywords = input.keywords
    let note = input.note;

    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err) {
            console.log("[ERROR] No se pudo conectar a MongoDB");
            return callback('Error de conexion');
        }

        let collection = db.collection('categories');

        function prepareCategories(category, cb) {
            findAndEditCategories(collection, category, keywords, note, cb)
        }

        async.map(categories, prepareCategories, function(err, results) {
            db.close();

            if (err) {
                console.log("[ERROR] No se udieron editar los datos en MongoDB");
                return callback('Error de conexion');
            }
            
            return callback(results);
        })
    });
}

function findAndEditCategories(collection, category, keywords, note, cb) {
    if(!category.cat || note < 1 || note > 5) {
        console.log("[ERROR] Formato incorrecto!");
        return cb("Wrong format");
    }

    collection.find({'name': {$eq: category.cat.toLowerCase()}}).toArray(function(err, docs) {
        if (err || _.isEmpty(docs[0])) {
            console.log("[ERROR] No se pudo obtener datos anteriores en MongoDB");
            return cb(err || "[ERROR] No se pudo obtener datos anteriores");
        }

        let wordsAux = docs[0].keywords;
        let index;

        keywords.forEach(function(word) {
            index = _.findIndex(wordsAux, function(wordDB) {
                return wordDB.name == word
            });

            if (index != -1) {
                wordsAux[index].score = wordsAux[index].score + ConfigServer.values.scoreKeywords[note];
            } else {
                wordsAux.push({
                    name: word,
                    score: 1
                });
            };
        });

        collection.update({'_id': docs[0]["_id"]}, {$set: {'keywords': wordsAux}}, function(err, docs) {
            if (err) {
                console.log("[ERROR] No se pudo actualizar datos en MongoDB");
                return cb(err);
            }

            return cb(null, docs);
        });
    });
}
