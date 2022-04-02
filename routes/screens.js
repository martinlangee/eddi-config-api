const { StatusCodes } = require("http-status-codes");
const express = require("express");
const screens = express.Router();
const pool = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");

screens.use(express.json()); // => req.body

// '/screens' Routes ------

const SCREEN_COLUMNS = `screens.id, 
                        screens.name, 
                        screens.description, 
                        screens.size_x, 
                        screens.size_y, 
                        screens.thumbnail, 
                        screens.public, 
                        to_char(screens.created,  ${DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(screens.last_saved,  ${DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        screens.user_id`;

screens.route('')
    // get screens:
    // - of specified user 
    // - and of all public ones if ?public=true is passed additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {
        if (req.query.userId || req.query.public) {
            tryCatch(req, res, async(req, res) => {
                const queryUser = req.query.userId ? `user_id = ${req.query.userId}` : '';
                const queryPublic = req.query.public === 'true' ? (req.query.userId ? ' OR public = true' : 'public = true') : '';
                const queryStr =
                    `SELECT ${SCREEN_COLUMNS}, users.user_name, users.first_name, users.last_name
                     FROM screens
                     JOIN users
                       ON user_id = users.id
                     WHERE ${queryUser}${queryPublic};`;
                console.log({ queryStr });
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
                    `SELECT screens.id as screen_id, screens.user_id, screens.name, screens.description, screens.public
                     FROM widgets
                     JOIN screens_widgets
                       ON widgets.id = widget_id
                     JOIN screens
                       ON screens.id = screen_id
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
                `SELECT ${SCREEN_COLUMNS}, users.user_name, users.first_name, users.last_name
                 FROM screens
                 JOIN users
                   ON user_id = users.id;`;
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
                `INSERT INTO screens
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
                `SELECT ${SCREEN_COLUMNS}, users.user_name, users.first_name, users.last_name
                 FROM screens
                 JOIN users
                   ON user_id = users.id
                 WHERE screens.id = ${id};`;
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
                'UPDATE screens SET ' +
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
                `DELETE FROM screens 
                 WHERE id = ${id};`
            console.log({ id, queryStr });
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    });

module.exports = screens;