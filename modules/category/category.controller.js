const MongoClient = require('mongodb').MongoClient;

exports.saveRelations = function(categories) {
    if (!categories || !categories.length) {
        return console.log('[ERROR] No hay categorias para guardar!');
    }

    let reducedCategories = categories.slice(0, 5);

    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        if (err || !db) {
            return console.log('[ERROR] Error de conexion a MongoDB!');
        }

        let collection = db.collection('categories');

        function prepareRelations(category, cb) {
            findAndEditRelations(collection, category, categories, cb)
        }

        async.map(reducedCategories, prepareRelations, function(err, results) {
            db.close();
            
            if(err) {
                return console.log('[ERROR] No se pudieron guardar las relaciones en MongoDB!');
            } else {
                return console.log("[INFO] Guardadas relaciones");
            }
        })
    });
};

exports.similarCategories = function(category, categoriesFromResult, cb) {
    categoriesFromResult = _.pluck(categoriesFromResult, "cat");
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        let collection = db.collection('categories');

        collection.find({'name': {$eq: category}}).toArray(function(err, docs) {
            db.close();
            
            if (err || !docs || !docs[0]) {
                console.log("[ERROR] No se pudo obtener la categoria de MongoDB");
                return cb(err || "FALLO");
            }

            let relations = docs[0].relations;
            let filteredRelations = [];

            for (let relationName in relations) {
                let founded = 0;

                categoriesFromResult.forEach(function(result){
                    if (result == relationName) {
                        founded = 1;
                    }
                });

                if (!founded) {
                    filteredRelations.push({"cat":relationName, "score":relations[relationName]})
                }
            }

            filteredRelations = _.sortBy(filteredRelations, function(relation){return (-relation.score)});
            filteredRelations = _.pluck(filteredRelations, "cat");

            return cb(null, filteredRelations);
        });
    });
};

function findAndEditRelations(collection, category, categories, cb) {
    if (!collection || !category || !category.cat || !categories) {
        console.log("[ERROR] Faltan datos requeridos para almacenar en MongoDB");
        return cb("ERROR1");
    }

    collection.find({'name': {$eq: category.cat}}).toArray(function(err, docs) {
        if (err || !docs || !docs[0] || !docs[0].relations) {
            console.log("[ERROR] Error al intentar obtener categoria de MongoDB");
            return cb("ERROR2");
        }
        
        let aux = docs[0].relations;

        categories.forEach(function(categoryResult){
            if(categoryResult.cat != category.cat){
                if(!aux[categoryResult.cat]) {
                    aux[categoryResult.cat] = 1;
                } else {
                    aux[categoryResult.cat] = aux[categoryResult.cat]+1;
                }
            }
        });

        collection.update({_id: docs[0]["_id"]}, {$set: {relations: aux}}, function(err, docs) {
            if (err) {
                console.log("[ERROR] Error actualizar datos en MongoDB");
                return cb("ERROR3");
            }
            
            return cb(null, docs);
        })
    });
}
