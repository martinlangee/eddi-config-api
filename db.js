const { StatusCodes } = require("http-status-codes");
const { Client } = require("pg");
const moment = require("moment");

require('dotenv').config();

let dbConnectionStr = process.env.PGCONNECTION;

if (process.env.NODE_ENV === 'development') {
    const dbHost = "localhost";
    const dbUser = "postgres";
    const dbPassword = "brasil";
    const dbDatabase = "eddi_db";
    const dbPort = 5432;
    dbConnectionStr = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbDatabase}`;
}

const options = process.env.NODE_ENV === 'development' ? {
    connectionString: dbConnectionStr,
} : {
    connectionString: dbConnectionStr,
    ssl: {
        rejectUnauthorized: false
    }
}

const pgClient = new Client(options);

pgClient.connect()
    .then(() => {
        pgClient.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
            if (err) throw err;
            /* for (let row of res.rows) {
                 console.log(JSON.stringify(row));
             } */
            pgClient.end();
        })
    });

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
    return (await pgClient.query(queryStr)).rows[0].see_public_widgets;
}

const getSeePublicScreens = async(userId) => {
    const queryStr =
        `SELECT see_public_screens
         FROM users
         WHERE id = ${userId}`;
    console.log({ queryStr });
    const row = (await pgClient.query(queryStr)).rows[0].see_public_screens;
    return row;
}

const checkDuplicateUsername = async(userId, username) => {
    const queryStr =
        `SELECT user_name, email
         FROM users
         WHERE id <> ${userId}`;
    console.log({ queryStr });
    const users = (await pgClient.query(queryStr)).rows;


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
    const users = (await pgClient.query(queryStr)).rows;

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
    return { "id": (await pgClient.query(queryStr)).rows[0].id, "password": pwdhash };
}

const findUserByEmail = async(email) => {
    const queryStr =
        `SELECT id, user_name, email, password, level, status
         FROM users
         WHERE email = '${email}' AND status = 'active';`;
    console.log({ queryStr });
    const users = (await pgClient.query(queryStr)).rows;
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
    const users = (await pgClient.query(queryStr)).rows;
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
    pgClient,
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