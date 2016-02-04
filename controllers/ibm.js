var AlchemyAPI = require('../alchemyapi.js');
var alchemyapi = new AlchemyAPI();

exports.analyzeText = function(text,cb) {
    alchemyapi.taxonomy('text', text,{ 'sentiment':0 }, function(response) {
        var tax = response;
        alchemyapi.keywords('text', text,{ 'sentiment':0,"keywordExtractMode":"strict","outputMode":"json" }, function(response) {
            cb({"taxonomy":tax,"keywords":response})
        });
    });
};
