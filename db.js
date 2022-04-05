const { StatusCodes } = require("http-status-codes");
const Pool = require("pg").Pool;
const { DATETIME_DISPLAY_FORMAT, formatDateTime } = require("./utils");

const pool = new Pool({
    user: "postgres",
    password: "brasil",
    database: "eddi_db",
    host: "localhost",
    port: 5432
})

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

const dbCheckDuplicateUsernameOrEmail = async(username, email) => {
    const queryStr =
        `SELECT user_name, email
         FROM users`;
    console.log({ queryStr });
    const users = (await pool.query(queryStr)).rows;

    if (users.find(user => user.user_name === username))
        return { result: false, message: "Failed! User name already in use.", status: StatusCodes.BAD_REQUEST };

    if (users.find(user => user.email === email))
        return { result: false, message: "Failed! E-mail already in use.", status: StatusCodes.BAD_REQUEST };

    return { result: true, message: "OK", status: StatusCodes.OK };
}

const dbCreateUser = async(username, email, pwdhash) => {
    const queryStr =
        `INSERT INTO ${TUSERS}
           (user_name, email, pwd_hash, created)
         VALUES
           ('${username}', 
            '${email}',
            '${pwdhash}', 
            to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}))
            RETURNING id;`;
    console.log({ queryStr });
    return { "id": (await pool.query(queryStr)).rows[0].id, "pwd_hash": pwdhash };
}

const dbFindUserByEmail = async(email) => {
    const queryStr =
        `SELECT id, email, pwd_hash, level, status
         FROM users
         WHERE email = '${email}' AND status = 'active';`;
    console.log({ queryStr });
    const users = (await pool.query(queryStr)).rows;
    if (users) {
        return {...users[0], result: true };
    } else {
        return { result: false, message: "User E-mail not found", status: StatusCodes.NOT_FOUND }
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
    dbCheckDuplicateUsernameOrEmail,
    dbCreateUser,
    dbFindUserByEmail,
    dbFindUserById
};