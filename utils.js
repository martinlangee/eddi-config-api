const moment = require("moment");

/// encapsules a call to the passed function into a try..catch block
const tryCatch = async(req, res, func) => {
    try {
        return await func(req, res);
    } catch (error) {
        console.error("!!!", error);
        res.status(error.message);
    }
}

/// Replace single quotes with double ones to escape then before inserting string as value
const replaceQuotes = (value) => value && (typeof value === 'string') ? value.replace(/'/g, '\'\'') : value;

/// Returns the query to a single column as part of a complete UPDATE command.
/// If column value is undefined, it returns an empty string.
/// Handles the correct concatenation of the comma between the single column expressions and the framing of the value with quotes
let firstIsHandled;
const getParamQuery = (name, value, first = false, valueQuotes = true) => {
    if (first) firstIsHandled = false;
    // if not applicable omit quotes around values 
    const q = valueQuotes ? `'` : ``;
    // only if surrounding quotes are required, 'escape' them with "''"  
    if (valueQuotes) value = replaceQuotes(value);
    const res = (value && firstIsHandled ? ', ' : '') + (value ? `${name} = ${q}${value}${q}` : ``);
    firstIsHandled = true;
    return res;
}

const addParamQuery = (name, dataObj, isFirst = false) => {
    return getParamQuery(name, dataObj[name], isFirst);
}

const formatDateTime = (dateTime) => moment(dateTime).format('YYYY-MM-DD HH:mm')

const DATETIME_DISPLAY_FORMAT = `'YYYY-MM-DD HH24:MI'`;

module.exports = { tryCatch, getParamQuery, addParamQuery, formatDateTime, DATETIME_DISPLAY_FORMAT };