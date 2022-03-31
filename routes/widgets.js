const express = require("express");
const widgets = express.Router();
const pool = require("../db");
const { tryCatch, getParamQuery } = require("../utils");

widgets.use(express.json()); // => req.body

// '/widgets' Routes ------

widgets.route('')
    // get all widgets of specified user
    .get((req, res, next) => {
        if (req.query.userId) {
            tryCatch(req, res, async(req, res) => {
                const queryStr =
                    `SELECT name, description, size_x, size_y, thumbnail, public, widgets.created, last_saved, users.user_name, users.first_name, users.last_name
                     FROM widgets
                     JOIN users
                       ON user_id = users.id
                     WHERE user_id = ${req.query.userId};`;
                res.json(await pool.query(queryStr));
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
                `SELECT name, description, size_x, size_y, thumbnail, public, widgets.created, last_saved, users.user_name, users.first_name, users.last_name
                 FROM widgets
                 JOIN users
                   ON user_id = users.id;`;
            res.json(await pool.query(queryStr));
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
                   ('${user_id}', '${name}', '${description}', '${size_x}', '${size_y}', '${thumbnail}', '${content}', '${public}', to_timestamp(${Date.now()} / 1000), to_timestamp(${Date.now()} / 1000));`;
            res.json(await pool.query(queryStr));
        })
    });

widgets.route('/:id')
    // get single widget
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `SELECT name, description, size_x, size_y, thumbnail, content, public, created, last_saved, Users.user_name, Users.first_name, Users.last_name
                 FROM widgets
                 JOIN users
                   ON user_id = users.id
                 WHERE id = ${id};`;
            res.json(await pool.query(queryStr));
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
                ` WHERE id = ${id};`
            console.log({ id, queryStr });
            res.json(await pool.query(queryStr));
        })
    })
    // delete widget
    // todo: check if other user has projects or widgets => delete them too
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