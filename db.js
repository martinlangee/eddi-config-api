const { StatusCodes } = require("http-status-codes");
const { Pool, Client } = require("pg");
const moment = require("moment");

require('dotenv').config();
console.log('development =', process.env.DEVELOPMENT);

let dbPassword = undefined;
let dbDatabase = undefined;
let dbUser = undefined;
let dbHost = undefined;
let dbSslmode = undefined;
//let dbConnectionStr = 'postgres://qkemcdpzbnefct:6e4cd1b9e6fd42ac3d14c16606b3fc9d769dbc8667151641fee9f013cc48625f@ec2-34-248-169-69.eu-west-1.compute.amazonaws.com:5432/d6bhuvlcnr5upu';

if (process.env.DEVELOPMENT) {
    dbConnectionStr = undefined;
    dbHost = "localhost";
    dbUser = "postgres";
    dbPassword = "brasil";
    dbDatabase = "eddi_db";
    dbSslmode = undefined;
} else {
    dbHost = "ec2-34-248-169-69.eu-west-1.compute.amazonaws.com";
    dbUser = "qkemcdpzbnefct";
    dbPassword = "6e4cd1b9e6fd42ac3d14c16606b3fc9d769dbc8667151641fee9f013cc48625f";
    dbDatabase = "d6bhuvlcnr5upu";
    dbSslmode = "require";
}

const pool = new Pool({
    //connectionString: dbConnectionStr,
    password: dbPassword,
    database: dbDatabase,
    user: dbUser,
    host: dbHost,
    port: 5432,
    acquireTimeoutMillis: 5000,
    createTimeoutMillis: 5000,
    idleTimeoutMillis: 60000,
    waitForAvailableConnectionTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
    sslmode: dbSslmode
});

pool.connect((err, client, release) => {
    console.log('pool:', err ? err : "succesfully connected");
    release();
})

const SECRET = "eddi-db-secret-key";
const DATETIME_DISPLAY_FORMAT = `'YYYY-MM-DD HH24:MI'`;

const TUSERS = 'users';
const TWIDGETS = 'widgets';
const TSCREENS = 'screens';
const TSCREENSWIDGETS = 'screens_widgets';

const formatDateTime = (dateTime) => moment(dateTime).format('YYYY-MM-DD HH:mm')

const getSeePublicWidgets = async(userId) => {
    const queryStr =
        `SELECT see_public_widgets
         FROM users
         WHERE id = ${userId}`;
    console.log({ queryStr });
    return (await pool.query(queryStr)).rows[0].see_public_widgets;
}

const getSeePublicScreens = async(userId) => {
    const queryStr =
        `SELECT see_public_screens
         FROM users
         WHERE id = ${userId}`;
    console.log({ queryStr });
    const row = (await pool.query(queryStr)).rows[0].see_public_screens;
    return row;
}

const checkDuplicateUsername = async(userId, username) => {
    const queryStr =
        `SELECT user_name, email
         FROM users
         WHERE id <> ${userId}`;
    console.log({ queryStr });
    const users = (await pool.query(queryStr)).rows;


    if (users && users.find(user => user.user_name === username)) {
        return { result: false, message: "Failed: User name already assigned.", status: StatusCodes.BAD_REQUEST };
    }

    return { result: true, message: "OK", status: StatusCodes.OK };
}

const checkDuplicateEmail = async(userId, email) => {
    const queryStr =
        `SELECT user_name, email
         FROM users
         WHERE id <> ${userId}`;
    console.log("Check email", { queryStr });
    const users = (await pool.query(queryStr)).rows;

    if (users && users.find(user => user.email === email))
        return { result: false, message: "Failed: E-mail already assigned.", status: StatusCodes.BAD_REQUEST };

    return { result: true, message: "OK", status: StatusCodes.OK };
}

const insertUser = async(username, email, pwdhash) => {
    const queryStr =
        `INSERT INTO ${TUSERS}
           (user_name, email, password, status, created)
         VALUES
           ('${username}', 
            '${email}',
            '${pwdhash}', 
            'active',
            to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}))
            RETURNING id;`;
    console.log({ queryStr });
    return { "id": (await pool.query(queryStr)).rows[0].id, "password": pwdhash };
}

const findUserByEmail = async(email) => {
    const queryStr =
        `SELECT id, user_name, email, password, level, status
         FROM users
         WHERE email = '${email}' AND status = 'active';`;
    console.log({ queryStr });
    const users = (await pool.query(queryStr)).rows;
    if (users && users.length) {
        return {...users[0], result: true };
    } else {
        return { result: false, message: "Failed: No account for this E-mail found", status: StatusCodes.NOT_FOUND }
    }
}


const findUserById = async(id) => {
    const queryStr =
        `SELECT id, email, level, status
         FROM users
         WHERE id = '${id}' AND status = 'active';`;
    console.log({ queryStr });
    const users = (await pool.query(queryStr)).rows;
    if (users) {
        return {...users[0], result: true };
    } else {
        return { result: false, message: "User-Id not found", status: StatusCodes.NOT_FOUND }
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
    // value must be tested explicitely if not 'undefined' due to possible boolean type values!!
    const res = (value !== undefined && firstIsHandled ? ', ' : '') + (value !== undefined ? `${name} = ${q}${value}${q}` : ``);
    firstIsHandled = true;
    return res;
}

const addParamQuery = (name, dataObj, isFirst = false) => {
    return getParamQuery(name, dataObj[name], isFirst);
}

const Db = {
    pool,
    SECRET,
    TUSERS,
    TWIDGETS,
    TSCREENS,
    TSCREENSWIDGETS,
    DATETIME_DISPLAY_FORMAT,
    formatDateTime,
    getSeePublicWidgets,
    getSeePublicScreens,
    checkDuplicateUsername,
    checkDuplicateEmail,
    insertUser,
    findUserByEmail,
    findUserById,
    replaceQuotes,
    getParamQuery,
    addParamQuery
};

module.exports = Db;