const { StatusCodes } = require("http-status-codes");
const express = require("express");
const { pool, dbGetSeePublicWidgets } = require("../db");
const { tryCatch, getParamQuery, DATETIME_DISPLAY_FORMAT, formatDateTime } = require("../utils");

const widgets = express.Router();

widgets.use(express.json()); // => req.body

// '/widgets' Routes ------

const WIDGET_COLUMNS = `widgets.id, 
                        widgets.name, 
                        widgets.description, 
                        widgets.size_x, 
                        widgets.size_y, 
                        widgets.thumbnail, 
                        widgets.public, 
                        to_char(widgets.created, ${DATETIME_DISPLAY_FORMAT}) as created, 
                        to_char(last_saved, ${DATETIME_DISPLAY_FORMAT}) as last_saved, 
                        widgets.user_id`;

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
                    `SELECT ${WIDGET_COLUMNS}, users.user_name, users.first_name, users.last_name
                     FROM widgets
                     JOIN users
                       ON user_id = users.id
                     WHERE user_id = ${userId} OR users.see_public_widgets = ${seePublic};`;
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
            const queryOnlyPublic = req.query.public === 'true' ? ' WHERE users.see_public_widgets = true' : '';
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, users.user_name, users.first_name, users.last_name
                 FROM widgets
                 JOIN users
                   ON user_id = users.id
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
                `INSERT INTO widgets
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
                    to_timestamp('${formatDateTime(Date.now())}', ${DATETIME_DISPLAY_FORMAT});`;
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
                `SELECT ${WIDGET_COLUMNS}, users.user_name, users.first_name, users.last_name
                 FROM widgets
                 JOIN users
                   ON user_id = users.id
                 WHERE widgets.id = ${id};`;
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
                'UPDATE widgets SET ' +
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
                `DELETE FROM widgets 
                 WHERE id = ${id};`;
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
        })
    });

module.exports = widgets;