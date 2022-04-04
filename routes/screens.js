const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screens = express.Router();
const { pool, TABLE_USERS, TABLE_SCREENS, dbGetSeePublicScreens } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");

screens.use(express.json()); // => req.body

// '/screens' Routes ------

const SCREEN_COLUMNS = `${TABLE_SCREENS}.id, 
                        ${TABLE_SCREENS}.name, 
                        ${TABLE_SCREENS}.description, 
                        ${TABLE_SCREENS}.size_x, 
                        ${TABLE_SCREENS}.size_y, 
                        ${TABLE_SCREENS}.thumbnail, 
                        ${TABLE_SCREENS}.public, 
                        to_char(${TABLE_SCREENS}.created,  ${DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(${TABLE_SCREENS}.last_saved,  ${DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        ${TABLE_SCREENS}.user_id`;

screens.route('')
    // get screens:
    // - of specified user 
    // - and of all public ones if ?public=true is passed additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {
        if (req.query.userId || req.query.public) {
            tryCatch(req, res, async(req, res) => {
                const userId = req.query.userId;
                const seePublic = await dbGetSeePublicScreens(userId);
                const queryStr =
                    `SELECT ${SCREEN_COLUMNS}, ${TABLE_USERS}.user_name, ${TABLE_USERS}.first_name, ${TABLE_USERS}.last_name
                     FROM ${TABLE_SCREENS}
                     JOIN ${TABLE_USERS}
                       ON user_id = ${TABLE_USERS}.id
                     WHERE user_id = ${userId} OR ${TABLE_USERS}.see_public_screens = ${seePublic};`;
                console.log({ userId, seePublic, queryStr });
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all screens a specified widget is used on
    .get((req, res, next) => {
        if (req.query.widgetId) {
            widgetId = req.query.widgetId;
            tryCatch(req, res, async(req, res) => {
                const queryStr =
                    `SELECT ${TABLE_SCREENS}.id as screen_id, ${TABLE_SCREENS}.user_id, ${TABLE_SCREENS}.name, ${TABLE_SCREENS}.description, ${TABLE_SCREENS}.public
                     FROM widgets
                     JOIN screens_widgets
                       ON widgets.id = widget_id
                     JOIN ${TABLE_SCREENS}
                       ON ${TABLE_SCREENS}.id = screen_id
                     WHERE widgets.id = ${widgetId}`;
                console.log({ widgetId, queryStr });
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all screens 
    // TODO: this should only be possible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT ${SCREEN_COLUMNS}, ${TABLE_USERS}.user_name, ${TABLE_USERS}.first_name, ${TABLE_USERS}.last_name
                 FROM ${TABLE_SCREENS}
                 JOIN ${TABLE_USERS}
                   ON user_id = ${TABLE_USERS}.id;`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // create screen
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `INSERT INTO ${TABLE_SCREENS}
                    (user_id, name, description, size_x, size_y, thumbnail, public, created, last_saved)
                 VALUES
                    ('${user_id}', 
                     '${name}', 
                     '${description}', 
                     '${size_x}', 
                     '${size_y}', 
                     '${thumbnail}', 
                     '${public}',
                     to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}),     
                     to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT});`;
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

screens.route('/:id')
    // get single screen
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `SELECT ${SCREEN_COLUMNS}, ${TABLE_USERS}.user_name, ${TABLE_USERS}.first_name, ${TABLE_USERS}.last_name
                 FROM ${TABLE_SCREENS}
                 JOIN ${TABLE_USERS}
                   ON user_id = ${TABLE_USERS}.id
                 WHERE ${TABLE_SCREENS}.id = ${id};`;
            console.log({ id, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // update screen
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const { name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `UPDATE ${TABLE_SCREENS} SET ` +
                getParamQuery('name', name, isFirst = true) +
                getParamQuery('description', description) +
                getParamQuery('size_x', size_x) +
                getParamQuery('size_y', size_y) +
                getParamQuery('thumbnail', thumbnail) +
                getParamQuery('content', content) +
                getParamQuery('public', public) +
                getParamQuery('last_saved', `to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT})`, false, false) +
                ` WHERE id = ${id};`
            console.log({ id, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
        })
    })
    // delete screen
    // todo: check if other user has screens => delete them too
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `DELETE FROM ${TABLE_SCREENS} 
                 WHERE id = ${id};`
            console.log({ id, queryStr });
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    });

module.exports = screens;