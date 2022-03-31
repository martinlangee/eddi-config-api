const { StatusCodes } = require("http-status-codes");
const express = require("express");
const users = express.Router({ mergeParams: true });
const pool = require("../db");
const { tryCatch, addParamQuery } = require("../utils");

users.use(express.json()); // => req.body

// '/users' Routes ------

// TODO: error handling and create better responses

users.route('')
    // get all users
    .get((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const queryStr =
                `SELECT *
                 FROM Users;`;
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
                `INSERT INTO Users
                   (user_name, first_name, last_name, email, pwd_hash, created, status, level, image)
                 VALUES
                   ('${user_name}', 
                   '${first_name}', 
                   '${last_name}', 
                   '${email}',
                   '${pwd_hash}', 
                   to_timestamp(${Date.now()} / 1000), 
                   '${status}',
                   '${status}',
                   'NULL');`; // TODO: save image data (from Base64?)
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
                 FROM Users
                 WHERE id = ${id};`
            res.status(StatusCodes.OK).json((await pool.query(queryStr)).rows);

        });
    })
    // update user
    .put((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const queryStr =
                'UPDATE Users SET ' +
                addParamQuery('user_name', req.body, isFirst = true) +
                addParamQuery('first_name', req.body) +
                addParamQuery('last_name', req.body) +
                addParamQuery('email', req.body) +
                addParamQuery('pwd_hash', req.body) +
                addParamQuery('status', req.body) +
                addParamQuery('level', req.body) +
                //addParamQuery('image', req.body) +     // TODO: handle data format of image
                ` WHERE id = ${id};`
            res.status(StatusCodes.ACCEPTED).json(await pool.query(queryStr));
        })
    })
    // delete user
    // todo: check if user has projects or vidgets => delete them too
    .delete((req, res) => {
        tryCatch(req, res, async(req, res) => {
            const { id } = req.params;
            const success = await pool.query(
                `DELETE FROM Users 
                 WHERE id = ${id};`).rowCount > 0;
            res.status(success ? StatusCodes.OK : StatusCodes.NOT_FOUND)
                .json({
                    message: (success ? `User ${id} deleted` : `User ${id} not found`),
                    user_id: id
                });
        })
    });

module.exports = users;