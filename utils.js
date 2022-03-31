/// encapsules a call to the passed function into a try..catch block
const tryCatch = (req, res, func) => {
    try {
        return func(req, res);
    } catch (error) {
        console.error("######", error);
        res.error(error);
    }
}

/// Returns the query to a single column as part of a complete UPDATE command.
/// If column value is undefined, it returns an empty string.
/// Handles the correct concatenation of the comma between the single column expressions.
let firstIsHandled;
const getParamQuery = (name, value, first = false) => {
    if (first) firstIsHandled = false;
    const res = (value && firstIsHandled ? ', ' : '') + (value ? `${name} = '${value}'` : ``);
    firstIsHandled = true;
    return res;
}

const addParamQuery = (name, dataObj, isFirst = false) => {
    return getParamQuery(name, dataObj[name], isFirst);
}

module.exports = { tryCatch, getParamQuery, addParamQuery };