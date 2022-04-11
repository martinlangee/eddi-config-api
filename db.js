const { StatusCodes } = require("http-status-codes");
const { Pool, Client } = require("pg");
const moment = require("moment");

require('dotenv').config();


const ENV_DEV = 'xxx_development';
let dbConnection = process.env.PGCONNECTION;
let dbDatabase = process.env.PG_DB;

console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV === ENV_DEV) {
    const dbHost = "localhost";
    const dbUser = "postgres";
    const dbPassword = "brasil";
    const dbPort = 5432;
    dbDatabase = "eddi_db";
    dbConnection = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}`;
}

const initDbPool = async() => {
    await createDB();
    await createDBTables();
    return new Promise((resolve) => {
        const options = process.env.NODE_ENV === ENV_DEV ? {
            connectionString: `${dbConnection}/${dbDatabase}`,
        } : {
            connectionString: `${dbConnection}/${dbDatabase}`,
            ssl: {
                rejectUnauthorized: false
            }
        }
        const pool = new Pool(options);
        pool.connect((err, client, release) => {
            console.log('pool:', err ? err : "succesfully connected");
            release();
        });
        resolve(pool);
    });
}

const createDB = async() => {
    try {
        let options = process.env.NODE_ENV === ENV_DEV ? {
            connectionString: `${dbConnection}/`,
        } : {
            connectionString: `${dbConnection}/${dbDatabase}`, // on heroku server, database is already created
            ssl: {
                rejectUnauthorized: false
            }
        }
        var client = new Client(options);
        await client.connect();

        let queryStr = `SELECT FROM pg_database WHERE datname = '${dbDatabase}'`;
        console.log({ queryStr });
        res = await client.query(queryStr)
        if (res.rows.length === 0) {
            // database does not exist, make it:
            let queryStr = `CREATE DATABASE ${dbDatabase}`
            console.log({ queryStr });
            await client.query(queryStr);
        }
    } catch (e) {
        console.log(e);
    } finally {
        client.end();
    }
}
const createDBTables = async(client) => {
    try {
        let options = process.env.NODE_ENV === ENV_DEV ? {
            connectionString: `${dbConnection}/${dbDatabase}`,
        } : {
            connectionString: `${dbConnection}/${dbDatabase}`,
            ssl: {
                rejectUnauthorized: false
            }
        }
        client = new Client(options);
        await client.connect();

        /* re-create all tables:       
                let queryStr = 'DROP TABLE screens_widgets';
                console.log({ queryStr });
                await client.query(queryStr);
                queryStr = 'DROP TABLE screens';
                console.log({ queryStr });
                await client.query(queryStr);
                queryStr = 'DROP TABLE widgets';
                console.log({ queryStr });
                await client.query(queryStr);
                queryStr = 'DROP TABLE users';
                console.log({ queryStr });
                await client.query(queryStr);
                */

        // create users table if not exists
        queryStr =
            `CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    user_name varchar UNIQUE NOT NULL,
                    first_name varchar,
                    last_name varchar,
                    email varchar UNIQUE NOT NULL,
                    password varchar NOT NULL,
                    created TIMESTAMP,
                    status varchar(10),
                    level INT,
                    image BYTEA,
                    see_public_screens BOOLEAN NOT NULL DEFAULT false,
                    see_public_widgets BOOLEAN NOT NULL DEFAULT false
                );`
        console.log({ queryStr });
        await client.query(queryStr);

        // create widgets table if not exists
        queryStr =
            `CREATE TABLE IF NOT EXISTS widgets (
            id SERIAL PRIMARY KEY,
            user_id INT,
            name varchar NOT NULL,
            description varchar,
            size_x INT NOT NULL,
            size_y INT NOT NULL,
            thumbnail BYTEA,
            content varchar,
            public BOOLEAN NOT NULL DEFAULT false,
            created TIMESTAMP,
            last_saved TIMESTAMP,
            CONSTRAINT fk_user
              FOREIGN KEY(user_id) 
                  REFERENCES users(id)
                  ON DELETE SET NULL
          );`
        console.log({ queryStr });
        await client.query(queryStr);

        // create screens table if not exists
        queryStr =
            `CREATE TABLE IF NOT EXISTS screens (
            id SERIAL PRIMARY KEY,
            user_id INT,
            name varchar NOT NULL,
            description varchar,
            size_x INT NOT NULL,
            size_y INT NOT NULL,
            thumbnail BYTEA,
            public BOOLEAN NOT NULL DEFAULT false,
            created TIMESTAMP,
            last_saved TIMESTAMP,
            CONSTRAINT fk_user
              FOREIGN KEY(user_id) 
                  REFERENCES users(id)
                  ON DELETE CASCADE);`
        console.log({ queryStr });
        await client.query(queryStr);

        // create screens_widgets table if not exists
        queryStr =
            `CREATE TABLE IF NOT EXISTS screens_widgets (
            screen_id INT,
            widget_id INT,
            user_id INT,
            x_pos INT,
            y_pos INT,
            size_x INT NOT NULL,
            size_y INT NOT NULL,
            PRIMARY KEY (screen_id, widget_id),
            CONSTRAINT fk_screens
              FOREIGN KEY(screen_id) 
                  REFERENCES screens(id)
                  ON DELETE CASCADE,
            CONSTRAINT fk_widgets
              FOREIGN KEY(widget_id) 
                  REFERENCES widgets(id)
                  ON DELETE CASCADE
          );`
        console.log({ queryStr });
        await client.query(queryStr);
    } catch (e) {
        console.log(e)
    } finally {
        client.end();
    }
}

let pgPool;
initDbPool()
    .then(pool => pgPool = pool);

// !important: using function to export pgPool to ensure the exported pool (used in other modules) is always up-to-date 
const pool = () => pgPool;

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
    const res = await pool().query(queryStr);
    console.log({ res });
    return res.rows[0].see_public_widgets === true;
}

const getSeePublicScreens = async(userId) => {
    const queryStr =
        `SELECT see_public_screens
         FROM users
         WHERE id = ${userId}`;
    console.log({ queryStr });
    return (await pool().query(queryStr)).rows[0].see_public_screens === true;
}

const checkDuplicateUsername = async(userId, username) => {
    const queryStr =
        `SELECT user_name, email
         FROM users
         WHERE id <> ${userId}`;
    console.log({ queryStr });
    const users = (await pool().query(queryStr)).rows;


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
    const users = (await pool().query(queryStr)).rows;

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
    try {
        res = await pool().query(queryStr)

    } catch (error) {
        console.log(error);
    }
    return { "id": res.rows[0].id, "password": pwdhash };
}

const findUserByEmail = async(email) => {
    const queryStr =
        `SELECT id, user_name, email, password, level, status
         FROM users
         WHERE email = '${email}' AND status = 'active';`;
    console.log({ queryStr });
    const users = (await pool().query(queryStr)).rows;
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
    const users = (await pool().query(queryStr)).rows;
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
    SECRET,
    TUSERS,
    TWIDGETS,
    TSCREENS,
    TSCREENSWIDGETS,
    DATETIME_DISPLAY_FORMAT,
    pool,
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