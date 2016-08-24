var MongoClient = require('mongodb').MongoClient;

exports.saveRelations = function(categories) {
    var reducedCategories = categories.slice(0, 5);
    MongoClient.connect(ConfigServer.mongo.url, function(err, db) {
        var collection = db.collection('categories');

        function prepareRelations(category, cb) {
            findAndEditRelations(collection, category, categories, cb)
        }
        async.map(reducedCategories, prepareRelations, function(err, results) {
            db.close();
            if(err)
                console.log(err);
            else
                console.log("Guardadas relaciones");
        })
    });

};

function findAndEditRelations(collection, category, categories, cb) {
    collection.find({'name': {$eq: category.cat}}).toArray(function(err, docs) {
        if (err || !docs[0])
            return cb("FALLO");
        var aux = docs[0].relations;
        categories.forEach(function(categoryResult){
            if(categoryResult.cat != category.cat){
                if(!aux[categoryResult.cat])
                    aux[categoryResult.cat] = 1;
                else
                    aux[categoryResult.cat] = aux[categoryResult.cat]+1;
            }
        });
        collection.update({_id: docs[0]["_id"]}, {$set: {relations: aux}}, function(err, docs) {
            if (err)
                return cb(err);
            return cb(null, docs);
        })
    });
}
