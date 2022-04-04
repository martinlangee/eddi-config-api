const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "brasil",
    database: "eddi_db",
    host: "localhost",
    port: 5432
})

const TABLE_USERS = 'users';
const TABLE_WIDGETS = 'widgets';
const TABLE_SCREENS = 'screens';
const TABLE_SCREENSWIDGETS = 'screens_widgets';

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

module.exports = { pool, TABLE_USERS, TABLE_WIDGETS, TABLE_SCREENS, TABLE_SCREENSWIDGETS, dbGetSeePublicWidgets, dbGetSeePublicScreens };