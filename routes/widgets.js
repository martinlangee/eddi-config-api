const { StatusCodes } = require("http-status-codes");
const express = require("express");
const { pool, TABLE_USERS, TABLE_WIDGETS, dbGetSeePublicWidgets } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");

const widgets = express.Router();

widgets.use(express.json()); // => req.body

// '/widgets' Routes ------

const WIDGET_COLUMNS = `${TABLE_WIDGETS}.id, 
                        ${TABLE_WIDGETS}.name, 
                        ${TABLE_WIDGETS}.description, 
                        ${TABLE_WIDGETS}.size_x, 
                        ${TABLE_WIDGETS}.size_y, 
                        ${TABLE_WIDGETS}.thumbnail, 
                        ${TABLE_WIDGETS}.public, 
                        to_char(${TABLE_WIDGETS}.created, ${DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(${TABLE_WIDGETS}.last_saved, ${DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        ${TABLE_WIDGETS}.user_id`;

widgets.route('')
    // get widgets:
    // - of specified user 
    // - and of all public ones if < users.seePublicWidgets === true > additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {

        if (req.query.userId) {
            tryCatch(req, res, async(req, res) => {
                const userId = req.query.userId;
                const seePublic = await dbGetSeePublicWidgets(userId);
                const queryStr =
                    `SELECT ${WIDGET_COLUMNS}, ${TABLE_USERS}.user_name, ${TABLE_USERS}.first_name, ${TABLE_USERS}.last_name
                     FROM ${TABLE_WIDGETS}
                     JOIN ${TABLE_USERS}
                       ON user_id = ${TABLE_USERS}.id
                     WHERE user_id = ${userId} OR ${TABLE_USERS}.see_public_widgets = ${seePublic};`;
                console.log({ userId, seePublic, queryStr });
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all widgets or only all public ones is <?public=true> is passed as query param
    // TODO: private widgets should only be visible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryOnlyPublic = req.query.public === 'true' ? ' WHERE ${TABLE_USERS}.see_public_widgets = true' : '';
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, ${TABLE_USERS}.user_name, ${TABLE_USERS}.first_name, ${TABLE_USERS}.last_name
                 FROM ${TABLE_WIDGETS}
                 JOIN ${TABLE_USERS}
                   ON user_id = ${TABLE_USERS}.id
                   ${queryOnlyPublic};`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // create widget
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `INSERT INTO ${TABLE_WIDGETS}
                   (user_id, name, description, size_x, size_y, thumbnail, content, public, created, last_saved)
                 VALUES
                   ('${user_id}', 
                    '${name}', 
                    '${description}', 
                    '${size_x}', 
                    '${size_y}', 
                    '${thumbnail}', 
                    '${content}', 
                    '${public}', 
                    to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT}),     
                    to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT})
                   );`;
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

widgets.route('/:id')
    // get single widget
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, ${TABLE_USERS}.user_name, ${TABLE_USERS}.first_name, ${TABLE_USERS}.last_name
                 FROM ${TABLE_WIDGETS}
                 JOIN ${TABLE_USERS}
                   ON user_id = ${TABLE_USERS}.id
                 WHERE ${TABLE_WIDGETS}.id = ${id};`;
            console.log({ id, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // update widget
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const { name, description, size_x, size_y, thumbnail, content, public } = req.body;
            const queryStr =
                `UPDATE ${TABLE_WIDGETS} SET ` +
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
    // delete widget
    // todo: check if other user has screens with this widgets => delete them too
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `DELETE FROM ${TABLE_WIDGETS} 
                 WHERE id = ${id};`;
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    });

module.exports = widgets;