require('require-webpack-compat')(module, require);

exports.routeModule = {};

/** Busca todo los archivos .router.js de la carpeta /modules */
var modules = require.context('../modules', true, /\.router.js$/);

/**
 * Carga todos los archivos de los modulos
 */
modules.keys().map(function(file) {
    var arrayPath;

    /** Si es en ubuntu el path es distinto */
    if(file.indexOf("\\") >= 0) {
        /** Ubuntu */
        arrayPath = file.split("\\");
    } else {
        /** Windows */
        arrayPath = file.split("/");
    }

    var lastIndex = arrayPath.length - 1;
    exports.routeModule['./'+arrayPath[lastIndex-1]] = require('../modules/'+arrayPath[lastIndex-1]+'/'+arrayPath[lastIndex]);
});
