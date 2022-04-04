const { StatusCodes } = require("http-status-codes");
const express = require("express");
const users = express.Router({ mergeParams: true });
const { pool, TABLE_USERS } = require("../db");
const { tryCatch, addParamQuery } = require("../utils");

users.use(express.json()); // => req.body

// '/users' Routes ------

users.route('')
    // get all users
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT *
                 FROM ${TABLE_USERS};`;
            console.log({ queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        })
    })
    // create user
    // TODO: check if user_name or email already present => send error
    .post((req, res) => {
        tryCatch(req, res, async(req, res) => {
            console.log(req.body);
            const { user_name, first_name, last_name, email, pwd_hash, status, level, image } = req.body;
            const queryStr =
                `INSERT INTO ${TABLE_USERS}
                   (user_name, first_name, last_name, email, pwd_hash, created, status, level, image, see_public_widgets, see_public_screens)
                 VALUES
                   ('${user_name}', 
                    '${first_name}', 
                    '${last_name}', 
                    '${email}',
                    '${pwd_hash}', 
                    to_timestamp(${Date.now()} / 1000), 
                    '${status}',
                    '${status}',
                    'NULL'         
                    'false',
                    'false');`; // TODO: save image data (from Base64?)
            console.log({ queryStr });
            res.status(StatusCodes.CREATED).json(await pool.query(queryStr));
        })
    });

users.route('/:id')
    // get single user
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `SELECT *
                 FROM ${TABLE_USERS}
                 WHERE id = ${id};`
            console.log({ id, queryStr });
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);
        });
    })
    // update user
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            let queryStr = '';
            if (req.query.see_public_widgets) {
                queryStr =
                    `UPDATE ${TABLE_USERS} SET ` +
                    addParamQuery('see_public_widgets', req.query, isFirst = true) +
                    ` WHERE id = ${id};`
            } else if (req.query.see_public_screens) {
                queryStr =
                    `UPDATE ${TABLE_USERS} SET ` +
                    addParamQuery('see_public_screens', req.query, isFirst = true) +
                    ` WHERE id = ${id};`
            } else {
                queryStr =
                    `UPDATE ${TABLE_USERS} SET ` +
                    addParamQuery('user_name', req.body, isFirst = true) +
                    addParamQuery('first_name', req.body) +
                    addParamQuery('last_name', req.body) +
                    addParamQuery('email', req.body) +
                    addParamQuery('pwd_hash', req.body) +
                    addParamQuery('status', req.body) +
                    addParamQuery('level', req.body) +
                    //addParamQuery('image', req.body) +     // TODO: handle data format of image
                    addParamQuery('see_public_widgets', req.body) +
                    addParamQuery('see_public_screens', req.body) +
                    ` WHERE id = ${id};`
            }
            console.log({ id, queryStr });
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
        })
    })
    // delete user
    // todo: check if user has projects or vidgets => delete them too
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                `DELETE FROM ${TABLE_USERS} 
                 WHERE id = ${id};`
            console.log({ id, queryStr });
            const success = await pool.query(queryStr).rowCount > 0;
            res.status(success ? StatusCodes.OK : StatusCodes.NOT_FOUND)
                .json({
                    message: (success ? `User ${id} deleted` : `User ${id} not found`),
                    user_id: id
                });
        })
    });

module.exports = users;