var regularExpression = require('../common/regularExpressions');
var configRoutes = require('../routes/routes.json');
var message = require('../common/messages.json');

/**
 * Si la ruta tiene validador, valida los valores que se mandaron en la solicitud
 * @param {object} req Datos del request del cliente y su session
 * @param {object} res Datos del response del cliente
 * @param {function} next Callback para pasar al siguiente paso de express
 */
exports.valid = function(req, res, next) {
    // console.log(configRoutes);
    var route = req.originalUrl.split("?")[0];
    var method = req.method

    if(!configRoutes || !configRoutes[route] || !configRoutes[route][req.method])
        return res.sender(message.badRequest);

    /** Si no tiene validador */
    if (!configRoutes[route][method].valid)
        return next();

    var valid = configRoutes[route][method].valid;
    var bodyData = req.body;
    var queryData = req.query;
    /** Si el input es valid, pasa al siguiente paso, si no envia un mensaje de error */
    if (validInput(valid, bodyData, queryData))
        return next();
    else
        return res.sender({'status': 400, 'message': 'invalid_input'});
};

/**
 * Revisa que los valores requeridos del input existan y sean validos
 * @param {object} valid Configuracion de la validacion de la llamada
 * @param {object} bodyData Datos del body de la solicitud
 * @param {object} queryData Datos de la query de la solicitud
 */
function validInput(valid, bodyData, queryData) {
    var isValid = true;
    valid.forEach(function(validValue) {
        if (isValid) {
            /** Si es input query, revisa lo que este en queryData, si no el que esta en el bodyData */
            if (validValue.input == "query") {
                if (queryData[validValue.name]) {
                    /** Valida el tipo */
                    isValid = validType(queryData[validValue.name], validValue);
                } else {
                    /** Si no es opcional, envia error */
                    isValid = validValue.optional ? true : false;
                }
            } else {
                if (bodyData[validValue.name]) {
                    /** Valida el tipo */
                    isValid = validType(bodyData[validValue.name], validValue);
                } else {
                    /** Si no es opcional, envia error */
                    isValid = validValue.optional ? true : false;
                }
            }
        }
    })

    return isValid;
}

/**
 * Revisa si el tipo del valor coincide con el configurado
 * @param {*} value Valor a revisar (Puede ser de cualquier tipo)
 * @param {object} validParams Valores expecificados en la configuracion la llamada
 */
function validType(value, validParams) {
    var isValid;
    var type = validParams.type;
    switch (type) {
        /** Revisa que el valor sea un numero */
        case "number":
            isValid = validTypeNumber(value) ? validValueNumber(value, validParams) : false;
            break;
        /** Revisa que el valor sea un string */
        case "string":
            isValid = validTypeString(value) ? validValueString(value, validParams) : false;
            break;
        /** Revisa que el valor sea un object */
        case "object":
            isValid = validTypeObject(value);
            break;
        /** Revisa que el valor sea un array */
        case "array":
            isValid = validTypeArray(value);
            break;
        /** Revisa que el valor sea un string y pase por una expression regular especifica */
        case "custom":
            isValid = validTypeCustom(value, validParams) ? validValueString(value, validParams) : false;
            break;
        /** Da por valido cualquier tipo */
        case "generic":
            isValid = true;
            break;
        default:
            isValid = false;
    }
    return isValid;
}

/**
 * Revisa si el valor es del tipo String
 * @param {*} value Valor a revisar (Puede ser de cualquier tipo)
 */
function validTypeString(value) {
    return _.isString(value);
}

/**
 * Revisa si el valor tiene el largo maximo y/o minimo que esta configurado
 * @param {string} value String a revisar
 * @param {object} validParams Valores expecificados en la configuracion la llamada
 */
function validValueString(value, validParams) {
    var isValid = true;
    if (validParams.lengthMax)
        isValid = value.length <= validParams.lengthMax ? true : false;

    if (isValid && validParams.lengthMin)
        isValid = value.length >= validParams.lengthMin ? true : false;

    return isValid;
}

/**
 * Revisa si el valor es del tipo Number
 * @param {*} value Valor a revisar (Puede ser de cualquier tipo)
 */
function validTypeNumber(value) {
    var isValid;
    if (_.isString(value)) {
        var exp = regularExpression.number;
        isValid = exp.test(value);
    } else {
        isValid = _.isNumber(value);
    }
    return isValid;
}

/**
 * Revisa si el valor es mayor o igual al valor minimo y/o si el valor es menor o igual al valor maximo que esta configurado
 * @param {number} value Valor numerico a revisar
 * @param {object} validParams Valores expecificados en la configuracion la llamada
 */
function validValueNumber(value, validParams) {
    var isValid = true;
    var valueNumber = parseFloat(value);
    if (validParams.valueMax || validParams.valueMax == 0)
        isValid = valueNumber <= validParams.valueMax ? true : false;

    if (isValid && (validParams.valueMin || validParams.valueMin == 0))
        isValid = valueNumber >= validParams.valueMin ? true : false;

    return isValid;
}

/**
 * Revisa si el valor es del tipo Object
 * @param {*} value Valor a revisar (Puede ser de cualquier tipo)
 */
function validTypeObject(value) {
    var isValid;
    if (_.isString(value)) {
        try {
            var aux = JSON.parse(value);
            isValid = _.isObject(aux);
        } catch (e) {
            isValid = false;
        }
    } else {
        isValid = _.isObject(value);
    }

    return isValid;
}

/**
 * Revisa si el valor es del tipo Array
 * @param {*} value Valor a revisar (Puede ser de cualquier tipo)
 */
function validTypeArray(value) {
    var isValid;
    if (_.isString(value)) {
        try {
            var aux = JSON.parse(value);
            isValid = _.isArray(aux);
        } catch (e) {
            isValid = false;
        }
    } else {
        isValid = _.isArray(value);
    }

    return isValid;
}

/**
 * Revisa si el valor es del tipo String y si pasa por una expresion regular determinada
 * @param {*} value Valor a revisar (Puede ser de cualquier tipo)
 * @param {object} validParams Valores expecificados en la configuracion la llamada
 */
function validTypeCustom(value, validParams) {
    var isValid;
    if (validParams.customName && regularExpression[validParams.customName] && _.isString(value)) {
        var exp = regularExpression[validParams.customName];
        isValid = exp.test(value);
    } else {
        isValid = false;
    }

    return isValid;
}
