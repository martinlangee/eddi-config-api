const express = require("express");
const widgets = express.Router();
const pool = require("../db");
const { tryCatch, getParamQuery } = require("../utils");

widgets.use(express.json()); // => req.body

// '/vidgets' Routes ------

widgets.route('')
    // get all vidgets of specified user
    .get((req, res, next) => {
        if (req.query.user) {
            tryCatch(req, res, async(req, res) => {
                const queryStr =
                    `SELECT name, description, size_x, size_y, icon, public, created, last_saved, Users.first_name, Users.last_name
                     FROM Vidgets
                     JOIN Users
                       ON user_id = Users.id
                     WHERE user_id = ${req.query.user};`;
                res.json(await pool.query(queryStr));
            })
        } else {
            next();
        }
    })
    // get all vidgets 
    // TODO: this should only be possible for admin!
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT name, description, size_x, size_y, icon, public, created, last_saved, Users.first_name, Users.last_name
                 FROM Vidgets
                 JOIN Users
                   ON user_id = Users.id;`;
            res.json(await pool.query(queryStr));
        })
    })
    // create vidget
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_id, name, description, size_x, size_y, icon, content, public } = req.body;
            const queryStr =
                `INSERT INTO Vidgets
                   (user_id, name, description, size_x, size_y, icon, content, public, created, last_saved)
                 VALUES
                   ('${user_id}', '${name}', '${description}', '${size_x}', '${size_y}', '${icon}', '${content}', '${public}', to_timestamp(${Date.now()} / 1000), to_timestamp(${Date.now()} / 1000));`;
            res.json(await pool.query(queryStr));
        })
    });

widgets.route('/:id')
    // get single vidget
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `SELECT name, description, size_x, size_y, thumbnail, content, public, created, last_saved, Users.user_name, Users.first_name, Users.last_name
                 FROM widgets
                 JOIN users
                   ON user_id = Users.id
                 WHERE id = ${id};`;
            res.json(await pool.query(queryStr));
        })
    })
    // update vidget
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
    // delete vidget
    // todo: check if other user has projects or vidgets => delete them too
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