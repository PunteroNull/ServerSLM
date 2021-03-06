const fs = require('fs');
const _ = require('underscore');

fs.readFile('./categories.csv', 'utf-8', function(err, data) {
    if (err) throw err;

    let rows = data.split("\n");
    let parsedJsonA = {};
    let parsedJsonB = [];
    let id = 1;

    rows.forEach(function(row){
        let categories = row.split(",");
        categories = _.without(categories, "\r", "");
        let last = null;
        categories.forEach(function(category){
            if(!parsedJsonA[category]){
                parsedJsonA[category] = {"id":id};
                id++;
                if(last)
                    parsedJsonA[category].parent = last;
            }
            last = category;
        })
    });

    fs.writeFile('parsedCategoriesTypeA.json', JSON.stringify(parsedJsonA), function(err) {
        if (err) throw err;
    });

    for (category in parsedJsonA) {
        let aux = {};
        aux.id = parsedJsonA[category].id;
        if(parsedJsonA[category].parent)
            aux.parent = parsedJsonA[category].parent;
        aux.name = category;
        aux.keywords = [];
        aux.relations = [];
        parsedJsonB.push(aux)
    }
    fs.writeFile('parsedCategoriesTypeB.json', JSON.stringify(parsedJsonB), function(err) {
        if (err) throw err;
    });
});
