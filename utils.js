const { StatusCodes } = require("http-status-codes");
const { networkInterfaces } = require('os');

/// encapsules a call to the passed async function into a try..catch block
const tryCatch = async(req, res, func) => {
    try {
        return await func(req, res);
    } catch (error) {
        console.error("!!!", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
            ...error,
            status: StatusCodes.INTERNAL_SERVER_ERROR
        });
    }
}

const getLocalIpAddresses = () => {
    const nets = networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over internal (i.e. 127.0.0.1) addresses
            if (!net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
        return results;
    };
}

module.exports = { tryCatch, getLocalIpAddresses };