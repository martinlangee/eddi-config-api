const { StatusCodes } = require("http-status-codes");
const express = require("express");
const widgets = express.Router();
const pool = require("../db");
const { tryCatch, getParamQuery } = require("../utils");

widgets.use(express.json()); // => req.body

// '/widgets' Routes ------

const WIDGET_COLUMNS = `widgets.id, widgets.name, widgets.description, widgets.size_x, widgets.size_y, widgets.thumbnail, widgets.public, to_char(widgets.created, 'YYYY-MM-DD HH24:MI:SS') as created, to_char(last_saved, 'YYYY-MM-DD HH24:MI:SS') as last_saved, widgets.user_id`;

widgets.route('')
    // get widgets:
    // - of specified user 
    // - and of all public ones if ?public=true is passed additionally
    // - or all public one if no userId is passed
    .get((req, res, next) => {
        if (req.query.userId || req.query.public) {
            tryCatch(req, res, async(req, res) => {
                const queryUser = req.query.userId ? `user_id = ${req.query.userId}` : '';
                const queryPublic = req.query.public === 'true' ? (req.query.userId ? ' OR public = true' : 'public = true') : '';
                const queryStr =
                    `SELECT ${WIDGET_COLUMNS}, users.user_name, users.first_name, users.last_name
                     FROM widgets
                     JOIN users
                       ON user_id = users.id
                       WHERE ${queryUser}${queryPublic};`;
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all widgets on specified screen
    .get((req, res, next) => {
        if (req.query.screenId) {
            tryCatch(req, res, async(req, res) => {
                const queryStr =
                    `SELECT ${WIDGET_COLUMNS}
                     FROM screens
                     JOIN screens_widgets
                       ON screens.id = screen_id
                     JOIN widgets
                       ON widget_id = widgets.id
                     WHERE screens.id= ${req.query.screenId};`;
                res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
            })
        } else {
            next();
        }
    })
    // get all widgets 
    // TODO: this should only be possible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT ${WIDGET_COLUMNS}, users.user_name, users.first_name, users.last_name
                 FROM widgets
                 JOIN users
                   ON user_id = users.id;`;
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
                    to_timestamp(${Date.now()} / 1000),     
                    to_timestamp(${Date.now()} / 1000));`;
            res.status(StatusCodes.OK).json(await pool.query(queryStr));
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
                getParamQuery('last_saved', `to_timestamp(${Date.now()} / 1000)`) +
                ` WHERE id = ${id};`
            console.log({ id, queryStr });
            res.json(await pool.query(queryStr));
        })
    })
    // delete widget
    // todo: check if other user has screens with this widgets => delete them too
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            res.json(await pool.query(
                `DELETE FROM widgets 
                 WHERE id = ${id};`
            ));
        })
    });

module.exports = widgets;