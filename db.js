const { StatusCodes } = require("http-status-codes");
const Pool = require("pg").Pool;
const { DATETIME_DISPLAY_FORMAT, formatDateTime } = require("./utils");

const pool = new Pool({
    user: "postgres",
    password: "brasil",
    database: "eddi_db",
    host: "localhost",
    port: 5432,
    acquireTimeoutMillis: 5000,
    createTimeoutMillis: 5000,
    idleTimeoutMillis: 60000,
    waitForAvailableConnectionTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000
})

console.log('Pool created:', pool);

const SECRET = "eddi-db-secret-key";

const TUSERS = 'users';
const TWIDGETS = 'widgets';
const TSCREENS = 'screens';
const TSCREENSWIDGETS = 'screens_widgets';

const dbGetSeePublicWidgets = async(userId) => {
    const queryStr =
        `SELECT see_public_widgets
         FROM users
         WHERE id = ${userId}`;
    console.log({ queryStr });
    return (await pool.query(queryStr)).rows[0].see_public_widgets;
}

const dbGetSeePublicScreens = async(userId) => {
    const queryStr =
        `SELECT see_public_screens
         FROM users
         WHERE id = ${userId}`;
    console.log({ queryStr });
    const row = (await pool.query(queryStr)).rows[0].see_public_screens;
    return row;
}

const dbCheckDuplicateUsername = async(userId, username) => {
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

const dbCheckDuplicateEmail = async(userId, email) => {
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

const dbInsertUser = async(username, email, pwdhash) => {
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

const dbFindUserByEmail = async(email) => {
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


const dbFindUserById = async(id) => {
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


module.exports = {
    pool,
    SECRET,
    TUSERS,
    TWIDGETS,
    TSCREENS,
    TSCREENSWIDGETS,
    dbGetSeePublicWidgets,
    dbGetSeePublicScreens,
    dbCheckDuplicateUsername,
    dbCheckDuplicateEmail,
    dbInsertUser,
    dbFindUserByEmail,
    dbFindUserById
};