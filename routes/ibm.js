var AlchemyAPI = require('../alchemyapi.js');
var alchemyapi = new AlchemyAPI();

// exports.ibmTest = function(req, res, next) {
//     var demo_text = req.body.text;
//     console.log(alchemyapi)
//     alchemyapi.taxonomy('text', demo_text,{ 'sentiment':0 }, function(response) {
//         var output = {};
//         // output['keywords'] = { text:demo_text, response:JSON.stringify(response,null,4), results:response['keywords'] };
//         console.log(response);
//         var tax = response;
//         alchemyapi.keywords('text', demo_text,{ 'sentiment':0,"keywordExtractMode":"strict","outputMode":"json" }, function(response) {
//             var output = {};
//             // output['keywords'] = { text:demo_text, response:JSON.stringify(response,null,4), results:response['keywords'] };
//             console.log(response);
//             res.send({"taxonomy":tax,"keywords":response})
//             next();
//         });
//     });
// };
